import { Test, TestingModule } from '@nestjs/testing';
import { VehicleInspectionsService } from './vehicle-inspections.service';

describe('VehicleInspectionsService', () => {
  let service: VehicleInspectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleInspectionsService],
    }).compile();

    service = module.get<VehicleInspectionsService>(VehicleInspectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
