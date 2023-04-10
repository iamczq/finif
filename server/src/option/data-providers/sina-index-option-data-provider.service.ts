import { Injectable } from '@nestjs/common';
import { OptionQuoteDto } from '../dto/option-quote.dto';

@Injectable()
export class SinaIndexOptionDataProviderService {
  async getQuote(underlying: string, contractMonth: string): Promise<OptionQuoteDto[]> {
    return [new OptionQuoteDto({
      code: '',
      month: '',
      type: 'C',
      executionPrice: 0,
      price: 0,
      buyVol: 0,
      buyPrice: 0,
      sellPrice: 0,
      sellVol: 0,
      position: 0,
      changePercent: 0,
      underlyingPrice: 0,
    })];
  }
}

