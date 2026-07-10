import { AgentsModule } from '../agents/agents.module';
import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { ProvidersModule } from '../providers/providers.module';
import { RoutingPoliciesModule } from '../routing-policies/routing-policies.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatStore } from './chat.store';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';

@Module({
  imports: [AgentsModule, ProvidersModule, ModelsModule, RoutingPoliciesModule],
  controllers: [ChatController],
  providers: [ChatService, ChatStore, OllamaAdapter, OpenAiCompatibleAdapter],
})
export class ChatModule {}
