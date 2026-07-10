import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogProvider, RoutingPolicy } from './catalog.models';

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
}
