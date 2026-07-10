import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AgentsService } from '../agents/agents.service';
import { ModelsService } from '../models/models.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { RoutingPoliciesService } from '../routing-policies/routing-policies.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ExecuteChatDto } from './dto/execute-chat.dto';
import { ChatStore } from './chat.store';
import { ChatExecutionRequest, ChatMessage } from './chat.types';
import { LlmAdapter } from './adapters/llm-adapter.interface';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';

@Injectable()
export class ChatService {
  private readonly adapters: LlmAdapter[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly providersService: ProvidersService,
    private readonly modelsService: ModelsService,
    private readonly routingPoliciesService: RoutingPoliciesService,
    private readonly chatStore: ChatStore,
    ollamaAdapter: OllamaAdapter,
    openAiCompatibleAdapter: OpenAiCompatibleAdapter,
  ) {
    this.adapters = [ollamaAdapter, openAiCompatibleAdapter];
  }

  async listExecutions() {
    if (!process.env.DATABASE_URL) {
      return this.chatStore.listExecutions();
    }

    const executions = await this.prisma.execution.findMany({
      include: {
        provider: true,
        model: true,
        agent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return executions.map((execution) => ({
      id: execution.id,
      providerId: execution.providerId,
      modelId: execution.modelId,
      provider: execution.provider.name,
      model: execution.model.name,
      startedAt: execution.startedAt.toISOString(),
      finishedAt: execution.finishedAt.toISOString(),
      status: execution.status === 'SUCCESS' ? 'success' : 'error',
      sessionId: execution.sessionId ?? undefined,
      agentId: execution.agentId ?? undefined,
      agent: execution.agent?.name,
      routingPolicyId: execution.routingPolicyId ?? undefined,
      prompt: execution.prompt ?? undefined,
      output: execution.output ?? undefined,
      error: execution.error ?? undefined,
    }));
  }

  async listSessions() {
    if (!process.env.DATABASE_URL) {
      return this.chatStore.listSessions();
    }

    const sessions = await this.prisma.chatSession.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      title: session.title ?? undefined,
      agentId: session.agentId ?? undefined,
      messages: session.messages.map((message) => ({
        role: message.role as ChatMessage['role'],
        content: message.content,
      })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));
  }

  async saveSession(input: CreateSessionDto) {
    if (!process.env.DATABASE_URL) {
      return this.chatStore.upsertSession({
        id: input.sessionId,
        title: input.title,
        agentId: input.agentId,
        messages: input.messages,
      });
    }

    if (input.sessionId) {
      await this.prisma.chatMessage.deleteMany({ where: { sessionId: input.sessionId } });

      return this.prisma.chatSession.update({
        where: { id: input.sessionId },
        data: {
          title: input.title,
          agentId: input.agentId,
          messages: {
            create: input.messages,
          },
        },
        include: {
          messages: true,
        },
      });
    }

    return this.prisma.chatSession.create({
      data: {
        title: input.title,
        agentId: input.agentId,
        messages: {
          create: input.messages,
        },
      },
      include: {
        messages: true,
      },
    });
  }

  async execute(input: ExecuteChatDto) {
    const prepared = await this.prepareExecution(input);
    const { agent, adapter, model, provider, request, routingPolicy } = prepared;
    const startedAt = new Date().toISOString();

    try {
      const result = await adapter.execute(request);
      const finishedAt = new Date().toISOString();
      const sessionMessages = this.appendAssistantMessage(request.messages, result.output);
      const session = await this.persistSession(input, sessionMessages, agent?.id);
      const execution = await this.persistExecution({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'success',
        sessionId: session?.id,
        agentId: agent?.id,
        agent: agent?.name,
        routingPolicyId: routingPolicy?.id,
        prompt: input.prompt,
        output: result.output,
      });

      return {
        session,
        execution,
        result,
      };
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Execution failed';
      const session = await this.persistSession(input, request.messages, agent?.id);
      const execution = await this.persistExecution({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'error',
        sessionId: session?.id,
        agentId: agent?.id,
        agent: agent?.name,
        routingPolicyId: routingPolicy?.id,
        prompt: input.prompt,
        error: message,
      });

      return {
        session,
        execution,
        result: null,
        error: message,
      };
    }
  }

  async stream(input: ExecuteChatDto, response: Response) {
    const prepared = await this.prepareExecution(input);
    const { agent, adapter, model, provider, request, routingPolicy } = prepared;

    if (!adapter.stream) {
      throw new BadRequestException(`Streaming is not available for provider ${provider.provider}`);
    }

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    const startedAt = new Date().toISOString();
    let output = '';

    try {
      for await (const chunk of adapter.stream(request)) {
        output += chunk;
        response.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }

      const finishedAt = new Date().toISOString();
      const sessionMessages = this.appendAssistantMessage(request.messages, output);
      const session = await this.persistSession(input, sessionMessages, agent?.id);
      const execution = await this.persistExecution({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'success',
        sessionId: session?.id,
        agentId: agent?.id,
        agent: agent?.name,
        routingPolicyId: routingPolicy?.id,
        prompt: input.prompt,
        output,
      });

      response.write(`data: ${JSON.stringify({ type: 'done', execution, session, output })}\n\n`);
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Streaming failed';
      const session = await this.persistSession(input, request.messages, agent?.id);
      const execution = await this.persistExecution({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'error',
        sessionId: session?.id,
        agentId: agent?.id,
        agent: agent?.name,
        routingPolicyId: routingPolicy?.id,
        prompt: input.prompt,
        error: message,
      });

      response.write(`data: ${JSON.stringify({ type: 'error', error: message, execution, session })}\n\n`);
    } finally {
      response.end();
    }
  }

  private async prepareExecution(input: ExecuteChatDto) {
    const { agent, routingPolicy, provider, model } = await this.resolveExecutionTargets(input);
    this.ensureModelBelongsToProvider(provider, model);

    const sessionMessages = input.sessionId ? await this.loadSessionMessages(input.sessionId) : [];
    const requestMessages = this.composeConversationMessages(input, sessionMessages, agent?.instructions || undefined);
    const request: ChatExecutionRequest = {
      providerId: provider.id,
      modelId: model.id,
      provider: provider.provider,
      providerName: provider.name,
      baseUrl: input.baseUrl || provider.baseUrl,
      apiKey: input.apiKey,
      externalModelId: model.externalModelId,
      messages: requestMessages,
    };

    const adapter = this.adapters.find((item) => item.supports(provider.provider));

    if (!adapter) {
      throw new NotFoundException(`No adapter available for provider ${provider.provider}`);
    }

    return {
      agent,
      routingPolicy,
      provider,
      model,
      request,
      adapter,
    };
  }

  private ensureModelBelongsToProvider(provider: Awaited<ReturnType<ProvidersService['findOne']>>, model: Awaited<ReturnType<ModelsService['findOne']>>) {
    if ('providerConnectionId' in model && model.providerConnectionId !== provider.id) {
      throw new BadRequestException('Model does not belong to provider');
    }

    if (!('providerConnectionId' in model) && provider.models?.every((item: { id: string }) => item.id !== model.id)) {
      throw new BadRequestException('Model does not belong to provider');
    }
  }

  private async resolveExecutionTargets(input: ExecuteChatDto) {
    const agent = input.agentId ? await this.agentsService.findOne(input.agentId) : null;
    let routingPolicy = input.routingPolicyId ? await this.routingPoliciesService.findOne(input.routingPolicyId) : null;

    if (!routingPolicy && agent?.routingPolicyId) {
      routingPolicy = await this.routingPoliciesService.findOne(agent.routingPolicyId);
    }

    const providerId = input.providerId || routingPolicy?.providerId;
    const modelId = input.modelId || routingPolicy?.primaryModelId;

    if (!providerId || !modelId) {
      throw new BadRequestException('Provider and model are required unless resolved by routing policy');
    }

    const provider = await this.providersService.findOne(providerId);
    const model = await this.modelsService.findOne(modelId);

    return {
      agent,
      routingPolicy,
      provider,
      model,
    };
  }

  private composeConversationMessages(input: ExecuteChatDto, sessionMessages: ChatMessage[], agentInstructions?: string): ChatMessage[] {
    const messages: ChatMessage[] = [...sessionMessages];

    if (messages.length === 0 && (input.systemPrompt || agentInstructions)) {
      messages.push({
        role: 'system',
        content: input.systemPrompt || agentInstructions || '',
      });
    }

    if (input.messages.length > 0) {
      messages.push(...(input.messages as ChatMessage[]));
    }

    if (input.prompt) {
      messages.push({ role: 'user', content: input.prompt });
    }

    return messages;
  }

  private appendAssistantMessage(messages: ChatMessage[], output: string): ChatMessage[] {
    return [...messages, { role: 'assistant', content: output }];
  }

  private async loadSessionMessages(sessionId: string) {
    if (!process.env.DATABASE_URL) {
      return this.chatStore.listSessions().find((item) => item.id === sessionId)?.messages ?? [];
    }

    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return (
      session?.messages.map((message) => ({
        role: message.role as ChatMessage['role'],
        content: message.content,
      })) ?? []
    );
  }

  private async persistSession(input: ExecuteChatDto, messages: ChatMessage[], agentId?: string) {
    if (!messages.length) {
      return null;
    }

    if (!process.env.DATABASE_URL) {
      return this.chatStore.upsertSession({
        id: input.sessionId,
        title: input.prompt?.slice(0, 80) || 'Runtime chat session',
        agentId,
        messages,
      });
    }

    if (input.sessionId) {
      await this.prisma.chatMessage.deleteMany({ where: { sessionId: input.sessionId } });

      return this.prisma.chatSession.update({
        where: { id: input.sessionId },
        data: {
          title: input.prompt?.slice(0, 80) || undefined,
          agentId,
          messages: {
            create: messages,
          },
        },
      });
    }

    return this.prisma.chatSession.create({
      data: {
        title: input.prompt?.slice(0, 80) || 'Runtime chat session',
        agentId,
        messages: {
          create: messages,
        },
      },
    });
  }

  private async persistExecution(record: Parameters<ChatStore['createExecution']>[0]) {
    if (!process.env.DATABASE_URL) {
      return this.chatStore.createExecution(record);
    }

    const execution = await this.prisma.execution.create({
      data: {
        providerId: record.providerId,
        modelId: record.modelId,
        sessionId: record.sessionId,
        agentId: record.agentId,
        routingPolicyId: record.routingPolicyId,
        status: record.status === 'success' ? 'SUCCESS' : 'ERROR',
        prompt: record.prompt,
        output: record.output,
        error: record.error,
        startedAt: new Date(record.startedAt),
        finishedAt: new Date(record.finishedAt),
      },
    });

    return {
      ...record,
      id: execution.id,
    };
  }
}
