import { Test, TestingModule } from '@nestjs/testing';
import { AwsFilesService } from './aws.service';

describe('AwsService', () => {
  let service: AwsFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsFilesService],
    }).compile();

    service = module.get<AwsFilesService>(AwsFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
