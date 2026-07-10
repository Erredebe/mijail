import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ExecutionRecord } from './chat.types';

@Injectable()
export class ExecutionsStore {
  private readonly executions: ExecutionRecord[] = [];

  list() {
    return [...this.executions].reverse();
  }

  create(record: Omit<ExecutionRecord, 'id'>) {
    const execution = { id: randomUUID(), ...record };
    this.executions.push(execution);
    return execution;
  }
}
