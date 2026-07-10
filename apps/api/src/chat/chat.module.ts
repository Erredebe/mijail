import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { ProvidersModule } from '../providers/providers.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ExecutionsStore } from './executions.store';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';

@Module({
  imports: [ProvidersModule, ModelsModule],
  controllers: [ChatController],
  providers: [ChatService, ExecutionsStore, OllamaAdapter, OpenAiCompatibleAdapter],
})
export class ChatModule {}
