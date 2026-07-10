import { ChatExecutionRequest, ChatExecutionResult } from '../chat.types';

export interface LlmAdapter {
  supports(provider: string): boolean;
  execute(request: ChatExecutionRequest): Promise<ChatExecutionResult>;
}
