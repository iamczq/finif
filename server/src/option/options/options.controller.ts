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
  ): Promise<OptionQuoteDto[]> {
    return await this.optionService.getQuote(id, contract);
  }

  @Get('yield')
  public async getYield(
    @Query('underlying') underlying: string,
    @Query('contract') contract: string,
    @Query('nearContract') nearContract: string,
    @Query('valuation') valuation: number,
    @Query('spread') spread: number,
  ) {
    if (nearContract) {
      return this.getDoubleContractYield(underlying, contract, nearContract, valuation);
    } else if (spread > 0) {
      return this.getSpreadYield(underlying, contract, spread);
    } else {
      return this.getSingleContractYield(underlying, contract, valuation);
    }
  }

  private yieldFunc(amount: number, timeSpan: number, base: number) {
    const rate = ((amount / timeSpan) * 365) / base;
    return (rate * 100).toFixed(4) + '%';
  }

  private async getSingleContractYield(underlying: string, contract: string, valuation: number) {
    const quotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);

    return quotes.map((quote) => {
      const maxYield = this.yieldFunc(
        quote.sellPrice,
        quote.expireDays,
        quote.executionPrice - valuation,
      );

      const minYield = this.yieldFunc(
        quote.buyPrice,
        quote.expireDays,
        quote.executionPrice - valuation,
      );

      return {
        executionPrice: quote.executionPrice,
        expireDays: quote.expireDays,
        sellYield: maxYield,
        buyYield: minYield,
        sellPrice: quote.sellPrice,
        base: quote.executionPrice - 2000,
      };
    });
  }

  private async getOutOfTheMoneyPutQuotes(underlying: string, contract: string) {
    const quotes = await this.optionService.getQuote(underlying, contract);
    const underlyingPrice = quotes[0].underlyingPrice;
    const putQuotes = quotes.filter((quote) => quote.type.toLowerCase() === 'p');
    return putQuotes;
  }

  private async getDoubleContractYield(
    underlying: string,
    contract: string,
    nearContract: string,
    valuation: number,
  ) {
    const farQuotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);
    const nearQuotes = await this.getOutOfTheMoneyPutQuotes(underlying, nearContract);

    return farQuotes.map((farQuote) => {
      const nearQuote = nearQuotes.find(
        (nearQuote) => nearQuote.executionPrice === farQuote.executionPrice,
      );
      if (!nearQuote) {
        return;
      }

      let nearBuyPrice;
      let nearSellPrice;
      let nearMidPrice;
      if (nearQuote) {
        nearBuyPrice = nearQuote.buyPrice;
        nearSellPrice = nearQuote.sellPrice;
        nearMidPrice = (nearBuyPrice + nearSellPrice) / 2;
      }

      let farBuyPrice;
      let farSellPrice;
      let farMidPrice;
      if (nearQuote) {
        farBuyPrice = farQuote.buyPrice;
        farSellPrice = farQuote.sellPrice;
        farMidPrice = (farBuyPrice + farSellPrice) / 2;
      }

      const timeSpan = farQuote.expireDays - nearQuote.expireDays;

      const moveSellYield = this.yieldFunc(
        farSellPrice - nearMidPrice,
        timeSpan,
        farQuote.executionPrice - valuation,
      );
      const moveSellDescription = `farSellPrice ${farSellPrice} - nearMidPrice ${nearMidPrice}: ${moveSellYield}`;

      const moveBuyYield = this.yieldFunc(
        farBuyPrice - nearMidPrice,
        timeSpan,
        farQuote.executionPrice - valuation,
      );
      const moveBuyDescription = `farBuyPrice ${farBuyPrice} - nearMidPrice ${nearMidPrice}: ${moveBuyYield}`;

      return {
        executionPrice: farQuote.executionPrice,
        expireDays: farQuote.expireDays,
        sellYield: this.yieldFunc(
          farQuote.sellPrice,
          farQuote.expireDays,
          farQuote.executionPrice / 2,
        ),
        buyYield: this.yieldFunc(
          farQuote.buyPrice,
          farQuote.expireDays,
          farQuote.executionPrice / 2,
        ),
        sellPrice: farSellPrice,
        buyPrice: farBuyPrice,
        midPrice: farMidPrice,
        nearBuyPrice: nearBuyPrice,
        nearSellPrice: nearSellPrice,
        nearMidPrice: nearMidPrice,
        timeSpan: timeSpan,
        base: farQuote.executionPrice - valuation,
        moveSellYield: moveSellYield,
        moveSellDescription: moveSellDescription,
        moveBuyYield: moveBuyYield,
        moveBuyDescription: moveBuyDescription,
      };
    });
  }

  async getSpreadYield(underlying: string, contract: string, spread: number) {
    const quotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);
    quotes.sort((a, b) => a.executionPrice - b.executionPrice);

    return quotes.map((quote, i, arr) => {
      const higherIndex = i + 1;
      if (arr[higherIndex]) {
        const higher = arr[higherIndex];

        return {
          executionPrice: quote.executionPrice,
          higherExecutionPrice: higher.executionPrice,
          description: `Sell ${higher.executionPrice}, buy ${quote.executionPrice}`,
          expireDays: quote.expireDays,
          leastYield: this.yieldFunc(
            higher.buyPrice - quote.sellPrice,
            quote.expireDays,
            higher.executionPrice - quote.executionPrice,
          ),
          midYield: this.yieldFunc(
            (higher.sellPrice + higher.buyPrice) / 2 - (quote.sellPrice + quote.buyPrice) / 2,
            quote.expireDays,
            higher.executionPrice - quote.executionPrice,
          ),
          midGain:
            (higher.sellPrice + higher.buyPrice) / 2 - (quote.sellPrice + quote.buyPrice) / 2,
          base: higher.executionPrice - quote.executionPrice,
          winLossRatio:
            (higher.executionPrice - quote.executionPrice) /
            ((higher.sellPrice + higher.buyPrice) / 2 - (quote.sellPrice + quote.buyPrice) / 2),
        };
      }
    });
  }
}
