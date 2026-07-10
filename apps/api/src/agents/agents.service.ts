import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { routingPolicySeed } from '../routing-policies/routing-policy.seed';
import { skillsSeed } from '../skills/skills.seed';
import { toolsSeed } from '../tools/tools.seed';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { agentsSeed } from './agents.seed';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return agentsSeed.map((agent) => this.attachSeedRelations(agent));
    }

    return this.prisma.agent.findMany({
      include: {
        routingPolicy: true,
        skills: {
          include: {
            skill: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const agent = agentsSeed.find((item) => item.id === id || item.slug === id);
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }
      return this.attachSeedRelations(agent);
    }

    const agent = await this.prisma.agent.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        routingPolicy: true,
        skills: {
          include: {
            skill: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async create(input: CreateAgentDto) {
    this.ensureDatabase();

    return this.prisma.agent.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        instructions: input.instructions,
        status: input.status ?? 'DRAFT',
        isEnabled: input.isEnabled ?? true,
        routingPolicyId: input.routingPolicyId,
        skills: input.skillIds?.length
          ? {
              create: input.skillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
        tools: input.toolIds?.length
          ? {
              create: input.toolIds.map((toolId) => ({ toolId })),
            }
          : undefined,
      },
      include: {
        routingPolicy: true,
        skills: {
          include: {
            skill: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
    });
  }

  async update(id: string, input: UpdateAgentDto) {
    this.ensureDatabase();
    await this.ensureAgentExists(id);

    const { skillIds, toolIds, ...data } = input;

    if (skillIds) {
      await this.prisma.agentSkill.deleteMany({
        where: { agentId: id },
      });
    }

    if (toolIds) {
      await this.prisma.agentTool.deleteMany({
        where: { agentId: id },
      });
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        ...data,
        skills: skillIds?.length
          ? {
              create: skillIds.map((skillId) => ({ skillId })),
            }
          : skillIds
            ? undefined
            : undefined,
        tools: toolIds?.length
          ? {
              create: toolIds.map((toolId) => ({ toolId })),
            }
          : toolIds
            ? undefined
            : undefined,
      },
      include: {
        routingPolicy: true,
        skills: {
          include: {
            skill: true,
          },
        },
        tools: {
          include: {
            tool: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    this.ensureDatabase();
    await this.ensureAgentExists(id);
    await this.prisma.agent.delete({ where: { id } });
    return { deleted: true, id };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensureAgentExists(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
  }

  private attachSeedRelations(agent: (typeof agentsSeed)[number]) {
    return {
      ...agent,
      routingPolicy: routingPolicySeed.find((item) => item.id === agent.routingPolicyId) ?? null,
      skills: (agent.skillIds ?? []).map((skillId) => ({
        skill: skillsSeed.find((item) => item.id === skillId),
      })).filter((item) => item.skill),
      tools: (agent.toolIds ?? []).map((toolId) => ({
        tool: toolsSeed.find((item) => item.id === toolId),
      })).filter((item) => item.tool),
    };
  }
}
