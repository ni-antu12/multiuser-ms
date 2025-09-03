import { Test, TestingModule } from '@nestjs/testing';
import { MultiuserController } from './multiuser.controller';

describe('MultiuserController', () => {
  let controller: MultiuserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiuserController],
    }).compile();

    controller = module.get<MultiuserController>(MultiuserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
