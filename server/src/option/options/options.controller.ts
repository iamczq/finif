import { Controller, Get, Param, Query } from '@nestjs/common';
import { OptionsService } from './options.service';
import { OptionQuoteDto } from '../dto/option-quote.dto';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionService: OptionsService) {}

  @Get(':id/:contract')
  public async getQuote(
    @Param('id') id: string,
    @Param('contract') contract: string,
  ) {
    return await this.optionService.getQuote(id, contract);
  }

  @Get('yield')
  public async getYield(
    @Query('underlying') underlying: string,
    @Query('contract') contract: string,
    @Query('nearContract') nearContract: string,
  ) {
    if (nearContract) {
      return this.getDoubleContractYield(underlying, contract, nearContract);
    } else {
      return this.getSingleContractYield(underlying, contract);
    }
  }

  private yieldFunc(amount: number, timeSpan: number, base: number) {
    const rate = ((amount / timeSpan) * 365) / base;
    return (rate * 100).toFixed(4) + '%';
  }

  private async getSingleContractYield(underlying: string, contract: string) {
    const quotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);

    return quotes.map((quote) => {
      return {
        executionPrice: quote.executionPrice,
        expireDays: quote.expireDays,
        sellYield: this.yieldFunc(
          quote.sellPrice,
          quote.expireDays,
          quote.executionPrice - 2000,
        ),
        buyYield: this.yieldFunc(
          quote.buyPrice,
          quote.expireDays,
          quote.executionPrice - 2000,
        ),
        sellPrice: quote.sellPrice,
        base: quote.executionPrice - 2000,
      };
    });
  }

  private async getOutOfTheMoneyPutQuotes(
    underlying: string,
    contract: string,
  ) {
    const quotes = await this.optionService.getQuote(underlying, contract);
    const underlyingPrice = quotes[0].underlyingPrice;
    const putQuotes = quotes.filter(
      (quote) =>
        quote.type.toLowerCase() === 'p' &&
        quote.executionPrice < underlyingPrice + 100,
    );
    return putQuotes;
  }

  private async getDoubleContractYield(
    underlying: string,
    contract: string,
    nearContract: string,
  ) {
    const farQuotes = await this.getOutOfTheMoneyPutQuotes(
      underlying,
      contract,
    );
    const nearQuotes = await this.getOutOfTheMoneyPutQuotes(
      underlying,
      nearContract,
    );

    return farQuotes.map((farQuote) => {
      const nearQuote = nearQuotes.find(
        (nearQuote) => nearQuote.executionPrice === farQuote.executionPrice,
      );
      let nearBuyPrice;
      let nearSellPrice;
      let nearMidPrice;
      if (nearQuote) {
        nearBuyPrice = nearQuote.buyPrice;
        nearSellPrice = nearQuote.sellPrice;
        nearMidPrice = (nearBuyPrice + nearSellPrice) / 2;
      }

      return {
        executionPrice: farQuote.executionPrice,
        expireDays: farQuote.expireDays,
        sellYield: this.yieldFunc(
          farQuote.sellPrice,
          farQuote.expireDays,
          farQuote.executionPrice - 2000,
        ),
        buyYield: this.yieldFunc(
          farQuote.buyPrice,
          farQuote.expireDays,
          farQuote.executionPrice - 2000,
        ),
        sellPrice: farQuote.sellPrice,
        nearBuyPrice: nearBuyPrice,
        nearSellPrice: nearSellPrice,
        nearMidPrice: nearMidPrice,
        nearExpire: nearQuote.expireDays,
        timeSpan: farQuote.expireDays - nearQuote.expireDays,
        base: farQuote.executionPrice - 2000,
        moveSellYield: this.yieldFunc(
          farQuote.sellPrice - nearMidPrice,
          farQuote.expireDays - nearQuote.expireDays,
          farQuote.executionPrice - 2000,
        ),
        moveBuyYield: this.yieldFunc(
          farQuote.buyPrice - nearMidPrice,
          farQuote.expireDays - nearQuote.expireDays,
          farQuote.executionPrice - 2000,
        ),
      };
    });
  }
}
