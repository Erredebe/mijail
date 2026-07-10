import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const totalRoles = await this.prisma.role.count();

    if (totalRoles > 0) {
      return;
    }

    await this.prisma.role.createMany({
      data: [
        { name: 'admin', description: 'Platform administrator' },
        { name: 'builder', description: 'Builds agents, prompts and tools' },
        { name: 'operator', description: 'Operates chats and runs' },
        { name: 'viewer', description: 'Read-only access' },
      ],
    });
  }
}
