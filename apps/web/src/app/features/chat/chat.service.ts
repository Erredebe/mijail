import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CatalogModel, CatalogProvider } from '../catalog/catalog.models';
import { ChatExecution, ChatExecutionResponse } from './chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  getCatalog() {
    return forkJoin({
      providers: this.http.get<CatalogProvider[]>(`${this.baseUrl}/providers`),
      models: this.http.get<CatalogModel[]>(`${this.baseUrl}/models`),
    });
  }

  getExecutions() {
    return this.http.get<ChatExecution[]>(`${this.baseUrl}/chat/executions`);
  }

  execute(payload: Record<string, unknown>) {
    return this.http.post<ChatExecutionResponse>(`${this.baseUrl}/chat/execute`, payload);
  }
}
