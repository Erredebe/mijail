import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CatalogModel, CatalogProvider } from '../catalog/catalog.models';
import { ChatExecution } from './chat.models';
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

  readonly providers = signal<CatalogProvider[]>([]);
  readonly models = signal<CatalogModel[]>([]);
  readonly executions = signal<ChatExecution[]>([]);
  readonly responseText = signal('');
  readonly errorText = signal('');
  readonly isExecuting = signal(false);

  readonly form = this.formBuilder.group({
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
      next: ({ providers, models }) => {
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

    this.chatService.getExecutions().subscribe({
      next: (executions) => this.executions.set(executions),
      error: () => this.executions.set([]),
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
    this.isExecuting.set(true);
    this.errorText.set('');
    this.responseText.set('');

    this.chatService
      .execute({
        providerId: raw.providerId,
        modelId: raw.modelId,
        baseUrl: raw.baseUrl || undefined,
        apiKey: raw.apiKey || undefined,
        systemPrompt: raw.systemPrompt || undefined,
        prompt: raw.prompt || undefined,
        messages: [],
      })
      .pipe(finalize(() => this.isExecuting.set(false)))
      .subscribe({
        next: (response) => {
          this.responseText.set(response.result?.output ?? 'Sin respuesta');
          this.errorText.set(response.error ?? '');
          this.reload();
        },
        error: (error) => {
          this.errorText.set(error?.error?.message ?? 'No se pudo ejecutar el chat');
        },
      });
  }
}
