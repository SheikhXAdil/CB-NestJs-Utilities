import { Test, TestingModule } from '@nestjs/testing';
import { GcpFilesService } from './gcp.service';

describe('GcpService', () => {
  let service: GcpFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GcpFilesService],
    }).compile();

    service = module.get<GcpFilesService>(GcpFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
