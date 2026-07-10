import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { providerCatalogSeed } from './provider-catalog.seed';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return providerCatalogSeed;
    }

    return this.prisma.providerConnection.findMany({
      include: {
        models: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const provider = providerCatalogSeed.find((item) => item.id === id || item.slug === id);

      if (!provider) {
        throw new NotFoundException('Provider not found');
      }

      return provider;
    }

    const provider = await this.prisma.providerConnection.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        models: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async create(input: CreateProviderDto) {
    this.ensureDatabase();

    return this.prisma.providerConnection.create({
      data: {
        name: input.name,
        slug: input.slug,
        provider: input.provider,
        kind: input.kind,
        baseUrl: input.baseUrl,
        apiKeyMasked: input.apiKeyMasked,
        isEnabled: input.isEnabled ?? true,
      },
    });
  }

  async update(id: string, input: UpdateProviderDto) {
    this.ensureDatabase();

    await this.ensureProviderExists(id);

    return this.prisma.providerConnection.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    this.ensureDatabase();

    await this.ensureProviderExists(id);
    await this.prisma.providerConnection.delete({ where: { id } });

    return { deleted: true, id };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensureProviderExists(id: string) {
    const provider = await this.prisma.providerConnection.findUnique({ where: { id } });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
  }
}
