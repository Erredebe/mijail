import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModelsService } from '../models/models.service';
import { ProvidersService } from '../providers/providers.service';
import { ExecuteChatDto } from './dto/execute-chat.dto';
import { ChatExecutionRequest } from './chat.types';
import { ExecutionsStore } from './executions.store';
import { LlmAdapter } from './adapters/llm-adapter.interface';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';

@Injectable()
export class ChatService {
  private readonly adapters: LlmAdapter[];

  constructor(
    private readonly providersService: ProvidersService,
    private readonly modelsService: ModelsService,
    private readonly executionsStore: ExecutionsStore,
    ollamaAdapter: OllamaAdapter,
    openAiCompatibleAdapter: OpenAiCompatibleAdapter,
  ) {
    this.adapters = [ollamaAdapter, openAiCompatibleAdapter];
  }

  listExecutions() {
    return this.executionsStore.list();
  }

  async execute(input: ExecuteChatDto) {
    const provider = await this.providersService.findOne(input.providerId);
    const model = await this.modelsService.findOne(input.modelId);

    if ('providerConnectionId' in model && model.providerConnectionId !== provider.id) {
      throw new BadRequestException('Model does not belong to provider');
    }

    if (!('providerConnectionId' in model) && provider.models?.every((item: { id: string }) => item.id !== model.id)) {
      throw new BadRequestException('Model does not belong to provider');
    }

    const request: ChatExecutionRequest = {
      providerId: provider.id,
      modelId: model.id,
      provider: provider.provider,
      providerName: provider.name,
      baseUrl: input.baseUrl || provider.baseUrl,
      apiKey: input.apiKey,
      externalModelId: model.externalModelId,
      systemPrompt: input.systemPrompt,
      prompt: input.prompt,
      messages: input.messages,
    };

    const adapter = this.adapters.find((item) => item.supports(provider.provider));

    if (!adapter) {
      throw new NotFoundException(`No adapter available for provider ${provider.provider}`);
    }

    const startedAt = new Date().toISOString();

    try {
      const result = await adapter.execute(request);
      const finishedAt = new Date().toISOString();
      const execution = this.executionsStore.create({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'success',
        prompt: input.prompt,
        output: result.output,
      });

      return {
        execution,
        result,
      };
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Execution failed';

      const execution = this.executionsStore.create({
        providerId: provider.id,
        modelId: model.id,
        provider: provider.name,
        model: model.name,
        startedAt,
        finishedAt,
        status: 'error',
        prompt: input.prompt,
        error: message,
      });

      return {
        execution,
        result: null,
        error: message,
      };
    }
  }
}
