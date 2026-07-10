import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CatalogModel, CatalogProvider } from '../catalog/catalog.models';
import { ChatAgent, ChatExecution, ChatExecutionResponse, ChatSession } from './chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  getCatalog() {
    return forkJoin({
      agents: this.http.get<ChatAgent[]>(`${this.baseUrl}/agents`),
      providers: this.http.get<CatalogProvider[]>(`${this.baseUrl}/providers`),
      models: this.http.get<CatalogModel[]>(`${this.baseUrl}/models`),
    });
  }

  getSessions() {
    return this.http.get<ChatSession[]>(`${this.baseUrl}/chat/sessions`);
  }

  getExecutions() {
    return this.http.get<ChatExecution[]>(`${this.baseUrl}/chat/executions`);
  }

  execute(payload: Record<string, unknown>) {
    return this.http.post<ChatExecutionResponse>(`${this.baseUrl}/chat/execute`, payload);
  }

  async stream(
    payload: Record<string, unknown>,
    handlers: {
      onChunk: (chunk: string) => void;
      onDone: (payload: any) => void;
      onError: (message: string) => void;
    },
  ) {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      handlers.onError('No se pudo iniciar el stream');
      return;
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
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event
          .split('\n')
          .find((item) => item.startsWith('data:'));

        if (!line) {
          continue;
        }

        const payload = JSON.parse(line.slice(5).trim());

        if (payload.type === 'chunk') {
          handlers.onChunk(payload.content ?? '');
          continue;
        }

        if (payload.type === 'done') {
          handlers.onDone(payload);
          continue;
        }

        if (payload.type === 'error') {
          handlers.onError(payload.error ?? 'Streaming error');
        }
      }
    }
  }
}
