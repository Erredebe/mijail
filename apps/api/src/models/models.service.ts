import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { providerCatalogSeed } from '../providers/provider-catalog.seed';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return providerCatalogSeed.flatMap((provider) =>
        provider.models.map((model) => ({
          ...model,
          providerConnectionId: provider.id,
          providerConnection: {
            id: provider.id,
            name: provider.name,
            slug: provider.slug,
            provider: provider.provider,
            kind: provider.kind,
          },
        })),
      );
    }

    return this.prisma.modelDefinition.findMany({
      include: {
        providerConnection: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const model = (await this.findAll()).find((item) => item.id === id || item.slug === id);

      if (!model) {
        throw new NotFoundException('Model not found');
      }

      return model;
    }

    const model = await this.prisma.modelDefinition.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        providerConnection: true,
      },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  async create(input: CreateModelDto) {
    this.ensureDatabase();

    return this.prisma.modelDefinition.create({
      data: {
        name: input.name,
        slug: input.slug,
        externalModelId: input.externalModelId,
        capabilities: input.capabilities,
        contextWindow: input.contextWindow,
        supportsStructuredIo: input.supportsStructuredIo ?? false,
        isEnabled: input.isEnabled ?? true,
        providerConnectionId: input.providerConnectionId,
      },
      include: {
        providerConnection: true,
      },
    });
  }

  async update(id: string, input: UpdateModelDto) {
    this.ensureDatabase();

    await this.ensureModelExists(id);

    return this.prisma.modelDefinition.update({
      where: { id },
      data: input,
      include: {
        providerConnection: true,
      },
    });
  }

  async remove(id: string) {
    this.ensureDatabase();

    await this.ensureModelExists(id);
    await this.prisma.modelDefinition.delete({ where: { id } });

    return { deleted: true, id };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensureModelExists(id: string) {
    const model = await this.prisma.modelDefinition.findUnique({ where: { id } });

    if (!model) {
      throw new NotFoundException('Model not found');
    }
  }
}
