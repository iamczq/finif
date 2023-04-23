import { Test, TestingModule } from '@nestjs/testing';
import { SinaIndexOptionDataProviderService } from './sina-index-option-data-provider.service';

describe('SinaIndexOptionDataProviderServiceService', () => {
  let service: SinaIndexOptionDataProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SinaIndexOptionDataProviderService],
    }).compile();

    service = module.get<SinaIndexOptionDataProviderService>(
      SinaIndexOptionDataProviderService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
