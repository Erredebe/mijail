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
