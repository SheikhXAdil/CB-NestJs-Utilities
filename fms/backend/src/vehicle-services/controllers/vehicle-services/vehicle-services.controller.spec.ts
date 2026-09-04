import { Test, TestingModule } from '@nestjs/testing';
import { VehicleServicesController } from './vehicle-services.controller';

describe('VehicleServicesController', () => {
  let controller: VehicleServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleServicesController],
    }).compile();

    controller = module.get<VehicleServicesController>(VehicleServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
