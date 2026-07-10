import { Injectable } from '@nestjs/common';
import { ChatExecutionRequest, ChatExecutionResult } from '../chat.types';
import { LlmAdapter } from './llm-adapter.interface';

@Injectable()
export class OllamaAdapter implements LlmAdapter {
  supports(provider: string) {
    return provider.toLowerCase() === 'ollama';
  }

  async execute(request: ChatExecutionRequest): Promise<ChatExecutionResult> {
    const response = await fetch(`${request.baseUrl ?? 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.externalModelId,
        stream: false,
        messages: this.buildMessages(request),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? 'Ollama request failed');
    }

    return {
      output: payload?.message?.content ?? '',
      raw: payload,
    };
  }

  async *stream(request: ChatExecutionRequest) {
    const response = await fetch(`${request.baseUrl ?? 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.externalModelId,
        stream: true,
        messages: this.buildMessages(request),
      }),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error ?? 'Ollama stream failed');
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
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          continue;
        }

        const payload = JSON.parse(trimmed);
        const content = payload?.message?.content ?? '';

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
