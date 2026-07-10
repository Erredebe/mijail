import { Injectable } from '@nestjs/common';
import { ChatExecutionRequest, ChatExecutionResult } from '../chat.types';
import { LlmAdapter } from './llm-adapter.interface';

@Injectable()
export class OpenAiCompatibleAdapter implements LlmAdapter {
  private readonly compatibleProviders = new Set(['openai', 'openrouter', 'azure-openai', 'lm-studio', 'vllm', 'llama.cpp-server']);

  supports(provider: string) {
    return this.compatibleProviders.has(provider.toLowerCase());
  }

  async execute(request: ChatExecutionRequest): Promise<ChatExecutionResult> {
    const response = await fetch(`${request.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.apiKey ? { Authorization: `Bearer ${request.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: request.externalModelId,
        messages: this.buildMessages(request),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'OpenAI-compatible request failed');
    }

    return {
      output: payload?.choices?.[0]?.message?.content ?? '',
      usage: {
        promptTokens: payload?.usage?.prompt_tokens,
        completionTokens: payload?.usage?.completion_tokens,
        totalTokens: payload?.usage?.total_tokens,
      },
      raw: payload,
    };
  }

  private buildMessages(request: ChatExecutionRequest) {
    const messages = [...request.messages];

    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    if (request.prompt) {
      messages.push({ role: 'user', content: request.prompt });
    }

    return messages;
  }
}
