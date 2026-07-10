import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CatalogModel, CatalogProvider } from '../catalog/catalog.models';
import { ChatAgent, ChatExecution, ChatSession } from './chat.models';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private readonly chatService = inject(ChatService);
  private readonly formBuilder = inject(FormBuilder);

  readonly agents = signal<ChatAgent[]>([]);
  readonly providers = signal<CatalogProvider[]>([]);
  readonly models = signal<CatalogModel[]>([]);
  readonly sessions = signal<ChatSession[]>([]);
  readonly executions = signal<ChatExecution[]>([]);
  readonly responseText = signal('');
  readonly errorText = signal('');
  readonly isExecuting = signal(false);
  readonly useStreaming = signal(true);

  readonly form = this.formBuilder.group({
    agentId: [''],
    sessionId: [''],
    providerId: ['', Validators.required],
    modelId: ['', Validators.required],
    baseUrl: [''],
    apiKey: [''],
    systemPrompt: ['Eres un agente util y preciso.'],
    prompt: [''],
  });

  constructor() {
    this.reload();
  }

  reload() {
    this.chatService.getCatalog().subscribe({
      next: ({ agents, providers, models }) => {
        this.agents.set(agents);
        this.providers.set(providers);
        this.models.set(models);

        const firstProvider = providers[0];
        if (firstProvider && !this.form.get('providerId')?.value) {
          this.form.patchValue({ providerId: firstProvider.id, baseUrl: firstProvider.baseUrl ?? '' });
        }

        const providerModels = this.filteredModels(firstProvider?.id ?? '');
        if (providerModels[0] && !this.form.get('modelId')?.value) {
          this.form.patchValue({ modelId: providerModels[0].id });
        }
      },
    });

    this.chatService.getSessions().subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessions.set([]),
    });

    this.chatService.getExecutions().subscribe({
      next: (executions) => this.executions.set(executions),
      error: () => this.executions.set([]),
    });
  }

  selectedSession() {
    return this.sessions().find((item) => item.id === this.form.get('sessionId')?.value) ?? null;
  }

  onAgentChange(agentId: string) {
    const agent = this.agents().find((item) => item.id === agentId);
    const routingPolicy = agent?.routingPolicy;
    const provider = this.providers().find((item) => item.id === routingPolicy?.providerId);
    const routedModels = routingPolicy ? this.filteredModels(routingPolicy.providerId) : [];

    this.form.patchValue({
      providerId: routingPolicy?.providerId ?? this.form.get('providerId')?.value ?? '',
      modelId: routingPolicy?.primaryModelId ?? routedModels[0]?.id ?? this.form.get('modelId')?.value ?? '',
      baseUrl: provider?.baseUrl ?? this.form.get('baseUrl')?.value ?? '',
      systemPrompt: agent?.instructions ?? 'Eres un agente util y preciso.',
      sessionId: '',
    });
  }

  onSessionChange(sessionId: string) {
    const session = this.sessions().find((item) => item.id === sessionId);
    const agent = this.agents().find((item) => item.id === session?.agentId);

    if (agent) {
      this.onAgentChange(agent.id);
    }

    this.form.patchValue({
      agentId: agent?.id ?? '',
      systemPrompt: agent?.instructions ?? this.form.get('systemPrompt')?.value ?? '',
      prompt: session?.messages.filter((item) => item.role === 'user').at(-1)?.content ?? '',
    });
  }

  onProviderChange(providerId: string) {
    const provider = this.providers().find((item) => item.id === providerId);
    const models = this.filteredModels(providerId);

    this.form.patchValue({
      baseUrl: provider?.baseUrl ?? '',
      modelId: models[0]?.id ?? '',
    });
  }

  filteredModels(providerId: string) {
    return this.models().filter((model) => model.providerConnectionId === providerId);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      agentId: raw.agentId || undefined,
      sessionId: raw.sessionId || undefined,
      providerId: raw.providerId || undefined,
      modelId: raw.modelId || undefined,
      baseUrl: raw.baseUrl || undefined,
      apiKey: raw.apiKey || undefined,
      systemPrompt: raw.systemPrompt || undefined,
      prompt: raw.prompt || undefined,
      messages: [],
    };

    this.isExecuting.set(true);
    this.errorText.set('');
    this.responseText.set('');

    if (this.useStreaming()) {
      this.chatService
        .stream(payload, {
          onChunk: (chunk) => this.responseText.update((current) => current + chunk),
          onDone: (response) => {
            this.form.patchValue({ sessionId: response.session?.id ?? raw.sessionId ?? '' });
            this.reload();
            this.isExecuting.set(false);
          },
          onError: (message) => {
            this.errorText.set(message);
            this.isExecuting.set(false);
          },
        })
        .catch(() => {
          this.errorText.set('No se pudo ejecutar el stream');
          this.isExecuting.set(false);
        });

      return;
    }

    this.chatService
      .execute(payload)
      .pipe(finalize(() => this.isExecuting.set(false)))
      .subscribe({
        next: (response) => {
          this.responseText.set(response.result?.output ?? 'Sin respuesta');
          this.errorText.set(response.error ?? '');
          this.form.patchValue({ sessionId: response.session?.id ?? raw.sessionId ?? '' });
          this.reload();
        },
        error: (error) => {
          this.errorText.set(error?.error?.message ?? 'No se pudo ejecutar el chat');
        },
      });
  }
}
