import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type DashboardSection = {
  title: string;
  items: string[];
};

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly stats = [
    { label: 'Dominios base', value: '15' },
    { label: 'Roles iniciales', value: '4' },
    { label: 'Conectores previstos', value: '9' },
    { label: 'Prioridades activas', value: '5' },
  ];

  readonly sections: DashboardSection[] = [
    {
      title: 'Gestion principal',
      items: ['Agents', 'Skills', 'MCPs', 'Tools', 'Prompts', 'Chat'],
    },
    {
      title: 'Capa de modelos',
      items: ['Providers', 'Models', 'Routing Policies', 'Fallbacks', 'Health Checks'],
    },
    {
      title: 'Gobierno y operacion',
      items: ['RBAC', 'Audit', 'Executions', 'Dashboard', 'Observabilidad'],
    },
  ];

  readonly roles = ['admin', 'builder', 'operator', 'viewer'];

  readonly providers = {
    remote: ['OpenAI', 'Anthropic', 'OpenRouter', 'Google', 'Azure OpenAI'],
    local: ['Ollama', 'LM Studio', 'vLLM', 'llama.cpp server'],
  };
}
