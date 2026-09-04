import { Test, TestingModule } from '@nestjs/testing';
import { InspectionTypeController } from './inspection-type.controller';

describe('InspectionTypeController', () => {
  let controller: InspectionTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionTypeController],
    }).compile();

    controller = module.get<InspectionTypeController>(InspectionTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
