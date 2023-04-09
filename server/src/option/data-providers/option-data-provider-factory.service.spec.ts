import { Test, TestingModule } from '@nestjs/testing';
import { OptionDataProviderFactoryService } from './option-data-provider-factory.service';

describe('OptionDataProviderFactoryService', () => {
  let service: OptionDataProviderFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptionDataProviderFactoryService],
    }).compile();

    service = module.get<OptionDataProviderFactoryService>(OptionDataProviderFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
