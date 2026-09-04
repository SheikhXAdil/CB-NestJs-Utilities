import { Test, TestingModule } from '@nestjs/testing';
import { VehicleServicesService } from './vehicle-services.service';

describe('VehicleServicesService', () => {
  let service: VehicleServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleServicesService],
    }).compile();

    service = module.get<VehicleServicesService>(VehicleServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
