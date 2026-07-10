import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CatalogAgent, CatalogProvider, CatalogSkill, CatalogTool, RoutingPolicy } from './catalog.models';
import { CatalogService } from './catalog.service';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);

  readonly agents = signal<CatalogAgent[]>([]);
  readonly skills = signal<CatalogSkill[]>([]);
  readonly tools = signal<CatalogTool[]>([]);
  readonly providers = signal<CatalogProvider[]>([]);
  readonly routingPolicies = signal<RoutingPolicy[]>([]);
  readonly loadError = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');
  readonly isSubmitting = signal(false);
  readonly editingAgentId = signal<string | null>(null);
  readonly editingSkillId = signal<string | null>(null);
  readonly editingToolId = signal<string | null>(null);
  readonly toolRunResult = signal('');

  readonly authForm = this.formBuilder.group({
    token: ['', Validators.required],
  });

  readonly providerForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    provider: ['', [Validators.required, Validators.minLength(2)]],
    kind: ['REMOTE', Validators.required],
    baseUrl: [''],
    apiKeyMasked: [''],
  });

  readonly modelForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    externalModelId: ['', [Validators.required, Validators.minLength(2)]],
    providerConnectionId: ['', Validators.required],
    capabilities: ['CHAT,STREAMING', Validators.required],
    contextWindow: ['8192'],
    supportsStructuredIo: [false],
  });

  readonly routingPolicyForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    environment: ['development'],
    providerId: ['', Validators.required],
    primaryModelId: ['', Validators.required],
    fallbackModelId: [''],
    isDefault: [false],
  });

  readonly agentForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    instructions: [''],
    status: ['ACTIVE', Validators.required],
    routingPolicyId: [''],
    skillIds: [[] as string[]],
    toolIds: [[] as string[]],
  });

  readonly skillForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    instructions: [''],
  });

  readonly toolForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    kind: ['http', [Validators.required, Validators.minLength(2)]],
    endpoint: [''],
    method: ['GET'],
    apiKey: [''],
    executePayload: [''],
  });

  constructor() {
    this.reloadCatalog();
  }

  reloadCatalog() {
    this.loadError.set('');

    this.catalogService.getProviders().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.syncDefaultSelections(providers);
      },
      error: () => {
        this.providers.set([]);
        this.loadError.set('No se pudo cargar el catalogo de providers y modelos.');
      },
    });

    this.catalogService.getRoutingPolicies().subscribe({
      next: (policies) => this.routingPolicies.set(policies),
      error: () => this.routingPolicies.set([]),
    });

    this.catalogService.getAgents().subscribe({
      next: (agents) => this.agents.set(agents),
      error: () => this.agents.set([]),
    });

    this.catalogService.getSkills().subscribe({
      next: (skills) => this.skills.set(skills),
      error: () => this.skills.set([]),
    });

    this.catalogService.getTools().subscribe({
      next: (tools) => this.tools.set(tools),
      error: () => this.tools.set([]),
    });
  }

  submitProvider() {
    if (this.providerForm.invalid || this.authForm.invalid) {
      this.providerForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    this.runAction(
      this.catalogService.createProvider(this.providerForm.getRawValue(), this.authForm.getRawValue().token ?? ''),
      'Provider creado correctamente.',
      () => this.providerForm.reset({ kind: 'REMOTE' }),
    );
  }

  submitModel() {
    if (this.modelForm.invalid || this.authForm.invalid) {
      this.modelForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    const raw = this.modelForm.getRawValue();
    const payload = {
      ...raw,
      contextWindow: Number(raw.contextWindow || 0) || undefined,
      capabilities: String(raw.capabilities)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    this.runAction(
      this.catalogService.createModel(payload, this.authForm.getRawValue().token ?? ''),
      'Modelo creado correctamente.',
      () => this.modelForm.reset({ capabilities: 'CHAT,STREAMING', contextWindow: '8192', supportsStructuredIo: false }),
    );
  }

  submitRoutingPolicy() {
    if (this.routingPolicyForm.invalid || this.authForm.invalid) {
      this.routingPolicyForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    const raw = this.routingPolicyForm.getRawValue();
    const payload = {
      ...raw,
      fallbackModelId: raw.fallbackModelId || undefined,
      environment: raw.environment || undefined,
    };

    this.runAction(
      this.catalogService.createRoutingPolicy(payload, this.authForm.getRawValue().token ?? ''),
      'Routing policy creada correctamente.',
      () => this.routingPolicyForm.reset({ environment: 'development', isDefault: false }),
    );
  }

  submitAgent() {
    if (this.agentForm.invalid || this.authForm.invalid) {
      this.agentForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    const raw = this.agentForm.getRawValue();
    const payload = {
      ...raw,
      routingPolicyId: raw.routingPolicyId || undefined,
      skillIds: raw.skillIds?.length ? raw.skillIds : undefined,
      toolIds: raw.toolIds?.length ? raw.toolIds : undefined,
    };

    const token = this.authForm.getRawValue().token ?? '';
    const request$ = this.editingAgentId()
      ? this.catalogService.updateAgent(this.editingAgentId()!, payload, token)
      : this.catalogService.createAgent(payload, token);

    this.runAction(request$, this.editingAgentId() ? 'Agent actualizado correctamente.' : 'Agent creado correctamente.', () => {
      this.editingAgentId.set(null);
      this.agentForm.reset({ status: 'ACTIVE', routingPolicyId: '' });
    });
  }

  editAgent(agent: CatalogAgent) {
    this.editingAgentId.set(agent.id);
    this.agentForm.patchValue({
      name: agent.name,
      slug: agent.slug,
      description: agent.description ?? '',
      instructions: agent.instructions ?? '',
      status: agent.status,
      routingPolicyId: agent.routingPolicyId ?? '',
      skillIds: agent.skills?.map((item) => item.skill.id) ?? [],
      toolIds: agent.tools?.map((item) => item.tool.id) ?? [],
    });
  }

  cancelAgentEdit() {
    this.editingAgentId.set(null);
    this.agentForm.reset({ status: 'ACTIVE', routingPolicyId: '', skillIds: [], toolIds: [] });
  }

  deleteAgent(agentId: string) {
    if (!this.authForm.valid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.runAction(
      this.catalogService.deleteAgent(agentId, this.authForm.getRawValue().token ?? ''),
      'Agent eliminado correctamente.',
      () => {
        if (this.editingAgentId() === agentId) {
          this.cancelAgentEdit();
        }
      },
    );
  }

  submitSkill() {
    if (this.skillForm.invalid || this.authForm.invalid) {
      this.skillForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    const token = this.authForm.getRawValue().token ?? '';
    const request$ = this.editingSkillId()
      ? this.catalogService.updateSkill(this.editingSkillId()!, this.skillForm.getRawValue(), token)
      : this.catalogService.createSkill(this.skillForm.getRawValue(), token);

    this.runAction(request$, this.editingSkillId() ? 'Skill actualizada correctamente.' : 'Skill creada correctamente.', () => {
      this.editingSkillId.set(null);
      this.skillForm.reset();
    });
  }

  editSkill(skill: CatalogSkill) {
    this.editingSkillId.set(skill.id);
    this.skillForm.patchValue({
      name: skill.name,
      slug: skill.slug,
      description: skill.description ?? '',
      instructions: skill.instructions ?? '',
    });
  }

  cancelSkillEdit() {
    this.editingSkillId.set(null);
    this.skillForm.reset();
  }

  deleteSkill(skillId: string) {
    if (!this.authForm.valid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.runAction(
      this.catalogService.deleteSkill(skillId, this.authForm.getRawValue().token ?? ''),
      'Skill eliminada correctamente.',
      () => {
        if (this.editingSkillId() === skillId) {
          this.cancelSkillEdit();
        }
      },
    );
  }

  submitTool() {
    if (this.toolForm.invalid || this.authForm.invalid) {
      this.toolForm.markAllAsTouched();
      this.authForm.markAllAsTouched();
      return;
    }

    const raw = this.toolForm.getRawValue();
    const payload = {
      ...raw,
      endpoint: raw.endpoint || undefined,
      method: raw.method || undefined,
    };

    delete (payload as Record<string, unknown>)['apiKey'];
    delete (payload as Record<string, unknown>)['executePayload'];

    const token = this.authForm.getRawValue().token ?? '';
    const request$ = this.editingToolId()
      ? this.catalogService.updateTool(this.editingToolId()!, payload, token)
      : this.catalogService.createTool(payload, token);

    this.runAction(
      request$,
      this.editingToolId() ? 'Tool actualizada correctamente.' : 'Tool creada correctamente.',
      () => {
        this.editingToolId.set(null);
        this.toolForm.reset({ kind: 'http', method: 'GET', apiKey: '', executePayload: '' });
      },
    );
  }

  editTool(tool: CatalogTool) {
    this.editingToolId.set(tool.id);
    this.toolForm.patchValue({
      name: tool.name,
      slug: tool.slug,
      description: tool.description ?? '',
      kind: tool.kind,
      endpoint: tool.endpoint ?? '',
      method: tool.method ?? 'GET',
      apiKey: '',
      executePayload: '',
    });
  }

  cancelToolEdit() {
    this.editingToolId.set(null);
    this.toolForm.reset({ kind: 'http', method: 'GET', apiKey: '', executePayload: '' });
  }

  deleteTool(toolId: string) {
    if (!this.authForm.valid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.runAction(
      this.catalogService.deleteTool(toolId, this.authForm.getRawValue().token ?? ''),
      'Tool eliminada correctamente.',
      () => {
        if (this.editingToolId() === toolId) {
          this.cancelToolEdit();
        }
      },
    );
  }

  executeTool(tool: CatalogTool) {
    let payload: unknown = {};

    const raw = this.toolForm.getRawValue().executePayload;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        this.toolRunResult.set('Payload JSON invalido');
        return;
      }
    }

    this.catalogService
      .executeTool(tool.id, {
        payload,
        apiKey: this.toolForm.getRawValue().apiKey || undefined,
      })
      .subscribe({
        next: (result) => this.toolRunResult.set(JSON.stringify(result, null, 2)),
        error: (error) => this.toolRunResult.set(JSON.stringify(error?.error ?? { message: 'Tool execution failed' }, null, 2)),
      });
  }

  toggleAgentSkill(skillId: string, checked: boolean) {
    const current = this.agentForm.get('skillIds')?.value ?? [];
    const next = checked ? [...current, skillId] : current.filter((id) => id !== skillId);
    this.agentForm.patchValue({ skillIds: next });
  }

  hasAgentSkill(skillId: string) {
    return (this.agentForm.get('skillIds')?.value ?? []).includes(skillId);
  }

  toggleAgentTool(toolId: string, checked: boolean) {
    const current = this.agentForm.get('toolIds')?.value ?? [];
    const next = checked ? [...current, toolId] : current.filter((id) => id !== toolId);
    this.agentForm.patchValue({ toolIds: next });
  }

  hasAgentTool(toolId: string) {
    return (this.agentForm.get('toolIds')?.value ?? []).includes(toolId);
  }

  providerModels(providerId: string) {
    return this.providers().find((provider) => provider.id === providerId)?.models ?? [];
  }

  private syncDefaultSelections(providers: CatalogProvider[]) {
    const firstProvider = providers[0];

    if (firstProvider && !this.modelForm.get('providerConnectionId')?.value) {
      this.modelForm.patchValue({ providerConnectionId: firstProvider.id });
    }

    if (firstProvider && !this.routingPolicyForm.get('providerId')?.value) {
      this.routingPolicyForm.patchValue({ providerId: firstProvider.id });
    }

    const selectedProviderId = this.routingPolicyForm.get('providerId')?.value;
    const selectedProvider = providers.find((provider) => provider.id === selectedProviderId) ?? firstProvider;
    const firstModel = selectedProvider?.models[0];

    if (selectedProvider && selectedProvider.id !== selectedProviderId) {
      this.routingPolicyForm.patchValue({ providerId: selectedProvider.id });
    }

    if (firstModel && !this.routingPolicyForm.get('primaryModelId')?.value) {
      this.routingPolicyForm.patchValue({ primaryModelId: firstModel.id });
    }
  }

  onRoutingProviderChange(providerId: string) {
    const firstModel = this.providerModels(providerId)[0];
    this.routingPolicyForm.patchValue({
      primaryModelId: firstModel?.id ?? '',
      fallbackModelId: '',
    });
  }

  private runAction(request$: ReturnType<CatalogService['createProvider']>, successMessage: string, onSuccess: () => void) {
    this.isSubmitting.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          onSuccess();
          this.actionSuccess.set(successMessage);
          this.reloadCatalog();
        },
        error: (error) => {
          this.actionError.set(error?.error?.message ?? 'No se pudo completar la operacion.');
        },
      });
  }
}
