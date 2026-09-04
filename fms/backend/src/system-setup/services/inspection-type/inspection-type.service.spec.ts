import { Test, TestingModule } from '@nestjs/testing';
import { InspectionTypeService } from './inspection-type.service';

describe('InspectionTypeService', () => {
  let service: InspectionTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionTypeService],
    }).compile();

    service = module.get<InspectionTypeService>(InspectionTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
