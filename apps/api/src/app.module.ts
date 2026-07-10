import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './database/database.module';
import { ModelsModule } from './models/models.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { RoutingPoliciesModule } from './routing-policies/routing-policies.module';
import { SkillsModule } from './skills/skills.module';
import { SystemModule } from './system/system.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, DatabaseModule, AuthModule, AgentsModule, ProvidersModule, ModelsModule, RoutingPoliciesModule, SkillsModule, ToolsModule, ChatModule, SystemModule],
})
export class AppModule {}
