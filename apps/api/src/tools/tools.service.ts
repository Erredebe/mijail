import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { ExecuteToolDto } from './dto/execute-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { toolsSeed } from './tools.seed';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return toolsSeed;
    }

    return this.prisma.tool.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const tool = toolsSeed.find((item) => item.id === id || item.slug === id);
      if (!tool) {
        throw new NotFoundException('Tool not found');
      }
      return tool;
    }

    const tool = await this.prisma.tool.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return tool;
  }

  async create(input: CreateToolDto) {
    this.ensureDatabase();
    return this.prisma.tool.create({ data: { ...input, isEnabled: input.isEnabled ?? true } });
  }

  async update(id: string, input: UpdateToolDto) {
    this.ensureDatabase();
    await this.ensureToolExists(id);
    return this.prisma.tool.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    this.ensureDatabase();
    await this.ensureToolExists(id);
    await this.prisma.tool.delete({ where: { id } });
    return { deleted: true, id };
  }

  async execute(id: string, input: ExecuteToolDto) {
    const tool = await this.findOne(id);

    if (!tool.isEnabled) {
      throw new BadRequestException('Tool is disabled');
    }

    if (tool.kind === 'http') {
      if (!tool.endpoint) {
        throw new BadRequestException('HTTP tool requires endpoint');
      }

      const method = (tool.method ?? 'GET').toUpperCase();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (input.apiKey) {
        headers.Authorization = `Bearer ${input.apiKey}`;
      }

      const response = await fetch(tool.endpoint, {
        method,
        headers,
        body: method === 'GET' ? undefined : JSON.stringify(input.payload ?? {}),
      });

      const text = await response.text();

      return {
        ok: response.ok,
        status: response.status,
        tool: tool.slug,
        output: text,
      };
    }

    return {
      ok: true,
      status: 200,
      tool: tool.slug,
      output: `Tool kind ${tool.kind} is registered but runtime execution is not implemented yet.`,
      payload: input.payload ?? null,
    };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensureToolExists(id: string) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
  }
}
