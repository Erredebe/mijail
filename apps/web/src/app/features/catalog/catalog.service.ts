import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogAgent, CatalogProvider, CatalogSkill, CatalogTool, RoutingPolicy } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  getProviders(): Observable<CatalogProvider[]> {
    return this.http.get<CatalogProvider[]>(`${this.baseUrl}/providers`);
  }

  getRoutingPolicies(): Observable<RoutingPolicy[]> {
    return this.http.get<RoutingPolicy[]>(`${this.baseUrl}/routing-policies`);
  }

  getAgents(): Observable<CatalogAgent[]> {
    return this.http.get<CatalogAgent[]>(`${this.baseUrl}/agents`);
  }

  getSkills(): Observable<CatalogSkill[]> {
    return this.http.get<CatalogSkill[]>(`${this.baseUrl}/skills`);
  }

  getTools(): Observable<CatalogTool[]> {
    return this.http.get<CatalogTool[]>(`${this.baseUrl}/tools`);
  }

  createProvider(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/providers`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createModel(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/models`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createRoutingPolicy(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/routing-policies`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createAgent(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/agents`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  updateAgent(agentId: string, payload: Record<string, unknown>, token: string) {
    return this.http.patch(`${this.baseUrl}/agents/${agentId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  deleteAgent(agentId: string, token: string) {
    return this.http.delete(`${this.baseUrl}/agents/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createSkill(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/skills`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  updateSkill(skillId: string, payload: Record<string, unknown>, token: string) {
    return this.http.patch(`${this.baseUrl}/skills/${skillId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  deleteSkill(skillId: string, token: string) {
    return this.http.delete(`${this.baseUrl}/skills/${skillId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  createTool(payload: Record<string, unknown>, token: string) {
    return this.http.post(`${this.baseUrl}/tools`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  updateTool(toolId: string, payload: Record<string, unknown>, token: string) {
    return this.http.patch(`${this.baseUrl}/tools/${toolId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  deleteTool(toolId: string, token: string) {
    return this.http.delete(`${this.baseUrl}/tools/${toolId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  executeTool(toolId: string, payload: Record<string, unknown>) {
    return this.http.post(`${this.baseUrl}/tools/${toolId}/execute`, payload);
  }
}
