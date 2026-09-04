import { Test, TestingModule } from '@nestjs/testing';
import { VehicleInspectionsController } from './vehicle-inspections.controller';

describe('VehicleInspectionsController', () => {
  let controller: VehicleInspectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleInspectionsController],
    }).compile();

    controller = module.get<VehicleInspectionsController>(VehicleInspectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
