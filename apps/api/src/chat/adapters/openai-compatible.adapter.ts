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

  async *stream(request: ChatExecutionRequest) {
    const response = await fetch(`${request.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.apiKey ? { Authorization: `Bearer ${request.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: request.externalModelId,
        stream: true,
        messages: this.buildMessages(request),
      }),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message ?? 'OpenAI-compatible stream failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const trimmed = part.trim();

        if (!trimmed.startsWith('data:')) {
          continue;
        }

        const data = trimmed.slice(5).trim();

        if (!data || data === '[DONE]') {
          continue;
        }

        const payload = JSON.parse(data);
        const content = payload?.choices?.[0]?.delta?.content ?? '';

        if (content) {
          yield content;
        }
      }
    }
  }

  private buildMessages(request: ChatExecutionRequest) {
    if (request.messages.length > 0) {
      return request.messages;
    }

    const messages = [] as ChatExecutionRequest['messages'];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    if (request.prompt) {
      messages.push({ role: 'user', content: request.prompt });
    }

    return messages;
  }
}
