import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system/system.controller';
import { SystemService } from './system/system.service';

describe('SystemController', () => {
  let systemController: SystemController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [SystemService],
    }).compile();

    systemController = moduleRef.get<SystemController>(SystemController);
  });

  it('should expose the platform blueprint', () => {
    const blueprint = systemController.getBlueprint();

    expect(blueprint.product.name).toBe('Agentic Platform');
    expect(blueprint.roles).toContain('admin');
    expect(blueprint.providerSupport.local).toContain('ollama');
  });
});
