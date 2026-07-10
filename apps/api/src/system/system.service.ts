import { Injectable } from '@nestjs/common';
import { platformBlueprint } from './platform-blueprint';

@Injectable()
export class SystemService {
  getBlueprint() {
    return platformBlueprint;
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
