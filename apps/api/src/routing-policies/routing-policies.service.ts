import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { providerCatalogSeed } from '../providers/provider-catalog.seed';
import { routingPolicySeed } from './routing-policy.seed';
import { CreateRoutingPolicyDto } from './dto/create-routing-policy.dto';
import { UpdateRoutingPolicyDto } from './dto/update-routing-policy.dto';

@Injectable()
export class RoutingPoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return routingPolicySeed.map((policy) => this.attachSeedRelations(policy));
    }

    return this.prisma.routingPolicy.findMany({
      include: {
        provider: true,
        primaryModel: true,
        fallbackModel: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const policy = routingPolicySeed.find((item) => item.id === id || item.name === id);

      if (!policy) {
        throw new NotFoundException('Routing policy not found');
      }

      return this.attachSeedRelations(policy);
    }

    const policy = await this.prisma.routingPolicy.findFirst({
      where: {
        OR: [{ id }, { name: id }],
      },
      include: {
        provider: true,
        primaryModel: true,
        fallbackModel: true,
      },
    });

    if (!policy) {
      throw new NotFoundException('Routing policy not found');
    }

    return policy;
  }

  async create(input: CreateRoutingPolicyDto) {
    this.ensureDatabase();

    return this.prisma.routingPolicy.create({
      data: {
        name: input.name,
        isDefault: input.isDefault ?? false,
        environment: input.environment,
        providerId: input.providerId,
        primaryModelId: input.primaryModelId,
        fallbackModelId: input.fallbackModelId,
      },
      include: {
        provider: true,
        primaryModel: true,
        fallbackModel: true,
      },
    });
  }

  async update(id: string, input: UpdateRoutingPolicyDto) {
    this.ensureDatabase();
    await this.ensurePolicyExists(id);

    return this.prisma.routingPolicy.update({
      where: { id },
      data: input,
      include: {
        provider: true,
        primaryModel: true,
        fallbackModel: true,
      },
    });
  }

  async remove(id: string) {
    this.ensureDatabase();
    await this.ensurePolicyExists(id);
    await this.prisma.routingPolicy.delete({ where: { id } });

    return { deleted: true, id };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensurePolicyExists(id: string) {
    const policy = await this.prisma.routingPolicy.findUnique({ where: { id } });

    if (!policy) {
      throw new NotFoundException('Routing policy not found');
    }
  }

  private attachSeedRelations(policy: (typeof routingPolicySeed)[number]) {
    const provider = providerCatalogSeed.find((item) => item.id === policy.providerId);
    const allModels = providerCatalogSeed.flatMap((item) => item.models.map((model) => ({ ...model, providerId: item.id })));
    const primaryModel = allModels.find((item) => item.id === policy.primaryModelId) ?? null;
    const fallbackModel = allModels.find((item) => item.id === policy.fallbackModelId) ?? null;

    return {
      ...policy,
      provider,
      primaryModel,
      fallbackModel,
    };
  }
}
