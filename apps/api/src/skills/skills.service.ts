import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { skillsSeed } from './skills.seed';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    if (!process.env.DATABASE_URL) {
      return skillsSeed;
    }

    return this.prisma.skill.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    if (!process.env.DATABASE_URL) {
      const skill = skillsSeed.find((item) => item.id === id || item.slug === id);
      if (!skill) {
        throw new NotFoundException('Skill not found');
      }
      return skill;
    }

    const skill = await this.prisma.skill.findFirst({ where: { OR: [{ id }, { slug: id }] } });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async create(input: CreateSkillDto) {
    this.ensureDatabase();
    return this.prisma.skill.create({ data: { ...input, isEnabled: input.isEnabled ?? true } });
  }

  async update(id: string, input: UpdateSkillDto) {
    this.ensureDatabase();
    await this.ensureSkillExists(id);
    return this.prisma.skill.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    this.ensureDatabase();
    await this.ensureSkillExists(id);
    await this.prisma.skill.delete({ where: { id } });
    return { deleted: true, id };
  }

  private ensureDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is required for write operations');
    }
  }

  private async ensureSkillExists(id: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
  }
}
