import { Test, TestingModule } from '@nestjs/testing';
import { MultiuserService } from './multiuser.service';

describe('MultiuserService', () => {
  let service: MultiuserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultiuserService],
    }).compile();

    service = module.get<MultiuserService>(MultiuserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
