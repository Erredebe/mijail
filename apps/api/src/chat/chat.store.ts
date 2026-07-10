import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatSessionRecord, ExecutionRecord } from './chat.types';

@Injectable()
export class ChatStore {
  private readonly executions: ExecutionRecord[] = [];
  private readonly sessions: ChatSessionRecord[] = [];

  listExecutions() {
    return [...this.executions].reverse();
  }

  listSessions() {
    return [...this.sessions].reverse();
  }

  upsertSession(input: {
    id?: string;
    title?: string;
    agentId?: string;
    messages: ChatSessionRecord['messages'];
  }) {
    const now = new Date().toISOString();

    if (input.id) {
      const existing = this.sessions.find((item) => item.id === input.id);
      if (existing) {
        existing.title = input.title;
        existing.agentId = input.agentId;
        existing.messages = input.messages;
        existing.updatedAt = now;
        return existing;
      }
    }

    const session: ChatSessionRecord = {
      id: randomUUID(),
      title: input.title,
      agentId: input.agentId,
      messages: input.messages,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.push(session);
    return session;
  }

  createExecution(record: Omit<ExecutionRecord, 'id'>) {
    const execution = { id: randomUUID(), ...record };
    this.executions.push(execution);
    return execution;
  }
}
