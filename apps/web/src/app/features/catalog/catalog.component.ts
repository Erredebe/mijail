import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CatalogProvider, RoutingPolicy } from './catalog.models';
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

  readonly providers = signal<CatalogProvider[]>([]);
  readonly routingPolicies = signal<RoutingPolicy[]>([]);
  readonly loadError = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');
  readonly isSubmitting = signal(false);

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
