import { Test, TestingModule } from '@nestjs/testing';
import { SinaEtfOptionDataProviderService } from './sina-etf-option-data-provider.service';

describe('SinaEtfOptionDataProviderService', () => {
  let service: SinaEtfOptionDataProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SinaEtfOptionDataProviderService],
    }).compile();

    service = module.get<SinaEtfOptionDataProviderService>(SinaEtfOptionDataProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
