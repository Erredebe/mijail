import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './database/database.module';
import { ModelsModule } from './models/models.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { RoutingPoliciesModule } from './routing-policies/routing-policies.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, DatabaseModule, AuthModule, ProvidersModule, ModelsModule, RoutingPoliciesModule, ChatModule, SystemModule],
})
export class AppModule {}
