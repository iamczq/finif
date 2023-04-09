import { Injectable } from '@nestjs/common';
import { SinaEtfOptionDataProviderService } from './sina-etf-option-data-provider.service';

@Injectable()
export class OptionDataProviderFactoryService {
    constructor(
        private sinaEtfOptionDataProvider: SinaEtfOptionDataProviderService
    ) { }

    getProvider (underlying: string) { return this.sinaEtfOptionDataProvider; }
}
