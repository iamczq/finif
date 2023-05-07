import { Injectable } from '@nestjs/common';
import { SinaEtfOptionDataProviderService } from './sina-etf-option-data-provider.service';
import { SinaIndexOptionDataProviderService } from './sina-index-option-data-provider.service';

@Injectable()
export class OptionDataProviderFactoryService {
  constructor(
    private sinaEtfOptionDataProvider: SinaEtfOptionDataProviderService,
    private sinaIndexOptionDataProvider: SinaIndexOptionDataProviderService,
  ) {}

  getProvider(underlying: string) {
    if (/^\d/.test(underlying)) {
      return this.sinaEtfOptionDataProvider;
    } else if (/^[a-zA-Z]/.test(underlying)) {
      return this.sinaIndexOptionDataProvider;
    } else {
      throw new Error('Not supported option');
    }
  }
}
