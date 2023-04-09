import { Injectable } from '@nestjs/common';
import { OptionDataProviderFactoryService } from '../data-providers/option-data-provider-factory.service';

@Injectable()
export class OptionsService {
  constructor (
    private optionDataProviderFactory: OptionDataProviderFactoryService
  ) {}

  /**
   * @param underlying ID of the underlying
   * @param contract contract string. e.g. 2303
   */
  async getQuote(underlying: string, contract: string) {
    const dataProvider = this.optionDataProviderFactory.getProvider(underlying);
    const options = await dataProvider.getQuote(underlying, contract);

    return options;
  }
}
