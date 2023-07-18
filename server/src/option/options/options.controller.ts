import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { OptionsService } from './options.service';
import { OptionQuoteDto } from '../dto/option-quote.dto';
import { OptionYieldDto } from '../dto/option-yield.dto';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionService: OptionsService) {}

  @UseInterceptors(ClassSerializerInterceptor)
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
  ): Promise<OptionYieldDto[]> {
    if (nearContract) {
      return this.getDoubleContractYields(underlying, contract, nearContract, valuation);
    } else if (spread > 0) {
      return this.getSpreadYields(underlying, contract, spread);
    } else {
      return this.getSingleContractYields(underlying, contract, valuation);
    }
  }

  private yieldFunc(amount: number, timeSpan: number, base: number): number {
    return ((amount / timeSpan) * 365) / base;
  }

  private yieldToString(rate: number): string {
    return (rate * 100).toFixed(2) + '%';
  }

  private async getSingleContractYields(
    underlying: string,
    contract: string,
    valuation: number,
  ): Promise<OptionYieldDto[]> {
    const quotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);

    const yields = quotes.map((quote) => {
      const executionPrice = quote.executionPrice;
      const margin = quote.executionPrice - valuation;
      const duration = quote.expireDays;
      const description = `${executionPrice} - ${duration} days with margin ${margin}`;

      const minIncome = quote.buyPrice;
      const maxIncome = quote.sellPrice;
      const midIncome = (minIncome + maxIncome) / 2;
      const minTheta = quote.buyPriceRisk.theta;
      const maxTheta = quote.sellPriceRisk.theta;
      const midTheta = (minTheta + maxTheta) / 2;

      const minYield = this.yieldFunc(minIncome, duration, margin);
      const minDescription =
        `Sell at ${minIncome}. ` + `Yield: ${this.yieldToString(minYield)}. ` + `θ: ${minTheta}`;

      const midYield = this.yieldFunc(midIncome, duration, margin);
      const midDescription =
        `Sell at ${midIncome}. ` + `Yield: ${this.yieldToString(midYield)}. ` + `θ: ${midTheta}`;

      const maxYield = this.yieldFunc(maxIncome, duration, margin);
      const maxDescription =
        `Sell at ${maxIncome}. ` + `Yield: ${this.yieldToString(maxYield)}. ` + `θ: ${maxTheta}`;

      return {
        description: description,
        executionPrice: executionPrice,
        margin: margin,
        duration: duration,
        minIncome: minIncome,
        minExpense: 0,
        minYield: minYield,
        minDescription: minDescription,
        midIncome: midIncome,
        midExpense: 0,
        midYield: midYield,
        midDescription: midDescription,
        maxIncome: maxIncome,
        maxExpense: 0,
        maxYield: maxYield,
        maxDescription: maxDescription,
        extra: {
          minTheta: minTheta,
          maxTheta: maxTheta,
        },
      };
    });

    return yields;
  }

  // todo
  private async getOutOfTheMoneyPutQuotes(underlying: string, contract: string) {
    const quotes = await this.optionService.getQuote(underlying, contract);
    const underlyingPrice = quotes[0].underlyingPrice;
    const putQuotes = quotes.filter((quote) => quote.type.toLowerCase() === 'p');
    return putQuotes;
  }

  private async getDoubleContractYields(
    underlying: string,
    contract: string,
    nearContract: string,
    valuation: number,
  ): Promise<OptionYieldDto[]> {
    const farQuotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);
    const nearQuotes = await this.getOutOfTheMoneyPutQuotes(underlying, nearContract);

    const yields = farQuotes.map((farQuote) => {
      const nearQuote = nearQuotes.find(
        (nearQuote) => nearQuote.executionPrice === farQuote.executionPrice,
      );
      if (!nearQuote) {
        return new OptionYieldDto();
      }

      return this.getDoubleContractYield(farQuote, nearQuote, valuation);
    });

    return yields.filter((y) => y.executionPrice > 0);
  }

  private getDoubleContractYield(
    far: OptionQuoteDto,
    near: OptionQuoteDto,
    valuation: number,
  ): OptionYieldDto {
    const executionPrice = far.executionPrice;
    const margin = far.executionPrice - valuation;
    const duration = far.expireDays - near.expireDays;
    const description = `${executionPrice} - ${duration} days with margin ${margin}`;

    // max and min here mean "To get min/max return, how much I would pay".
    let maxExpense;
    let minExpense;
    let midExpense;
    let maxExpenseTheta;
    let minExpenseTheta;
    let midExpenseTheta;
    if (near) {
      maxExpense = near.buyPrice;
      minExpense = near.sellPrice;
      midExpense = (maxExpense + minExpense) / 2;
      maxExpenseTheta = near.buyPriceRisk.theta;
      minExpenseTheta = near.sellPriceRisk.theta;
      midExpenseTheta = (maxExpenseTheta + minExpenseTheta) / 2;
    }

    let minIncome;
    let maxIncome;
    let midIncome;
    let minIncomeTheta;
    let maxIncomeTheta;
    let midIncomeTheta;
    if (far) {
      minIncome = far.buyPrice;
      maxIncome = far.sellPrice;
      midIncome = (minIncome + maxIncome) / 2;
      minIncomeTheta = far.buyPriceRisk.theta;
      maxIncomeTheta = far.sellPriceRisk.theta;
      midIncomeTheta = (minIncomeTheta + maxIncomeTheta) / 2;
    }

    const minYield = this.yieldFunc(minIncome - minExpense, duration, margin);
    const minDescription =
      `Sell at ${minIncome}, θ ${minIncomeTheta}` +
      `Move at ${minExpense}, θ ${minExpenseTheta}. ` +
      `Yield: ${this.yieldToString(minYield)}.`;

    const midYield = this.yieldFunc(midIncome - midExpense, duration, margin);
    const midDescription =
      `Sell between ${minIncome} and ${maxIncome}, θ ${midIncomeTheta}` +
      `Move between ${maxExpense} and ${minExpense}, θ ${midExpenseTheta}. ` +
      `Yield: ${this.yieldToString(midYield)}.`;

    const maxYield = this.yieldFunc(maxIncome - maxExpense, duration, margin);
    const maxDescription =
      `Sell at ${maxIncome}, θ ${maxIncomeTheta}` +
      `Move at ${maxExpense}, θ ${maxExpenseTheta}. ` +
      `Yield: ${this.yieldToString(maxYield)}.`;

    return {
      description: description,
      executionPrice: executionPrice,
      margin: margin,
      duration: duration,
      minIncome: minIncome,
      minExpense: minExpense,
      minYield: minYield,
      minDescription: minDescription,
      midIncome: midIncome,
      midExpense: midExpense,
      midYield: midYield,
      midDescription: midDescription,
      maxIncome: maxIncome,
      maxExpense: maxExpense,
      maxYield: maxYield,
      maxDescription: maxDescription,
    };
  }

  async getSpreadYields(
    underlying: string,
    contract: string,
    spread: number,
  ): Promise<OptionYieldDto[]> {
    const quotes = await this.getOutOfTheMoneyPutQuotes(underlying, contract);
    quotes.sort((a, b) => a.executionPrice - b.executionPrice);

    const yields = quotes.map((lower, i, arr) => {
      const higherIndex = i + 1;
      if (arr[higherIndex]) {
        const higher = arr[higherIndex];
        const executionPrice = lower.executionPrice;
        const higherExecutionPrice = higher.executionPrice;
        const margin = higherExecutionPrice - executionPrice;
        const duration = lower.expireDays;
        const description =
          `Sell ${higherExecutionPrice}, buy ${executionPrice}` +
          ` - ${duration} days with margin ${margin}`;

        const minIncome = higher.buyPrice;
        const minExpense = lower.sellPrice;
        const minYield = this.yieldFunc(minIncome - minExpense, duration, margin);
        const minDescription =
          `Sell at ${minIncome}, ` +
          `Move at ${minExpense}. ` +
          `Yield: ${this.yieldToString(minYield)}.`;

        const maxIncome = higher.sellPrice;
        const maxExpense = lower.buyPrice;
        const maxYield = this.yieldFunc(maxIncome - maxExpense, duration, margin);
        const maxDescription =
          `Sell at ${maxIncome}, ` +
          `Move at ${maxExpense}. ` +
          `Yield: ${this.yieldToString(maxYield)}.`;

        const midIncome = (maxIncome + minIncome) / 2;
        const midExpense = (maxExpense + minExpense) / 2;
        const midYield = this.yieldFunc(midIncome - midExpense, duration, margin);
        const midDescription =
          `Sell between ${minIncome} and ${maxIncome}, ` +
          `Move between ${maxExpense} and ${minExpense}. ` +
          `Yield: ${this.yieldToString(midYield)}.`;

        return {
          description: description,
          executionPrice: executionPrice,
          margin: margin,
          duration: duration,
          minIncome: minIncome,
          minExpense: minExpense,
          minYield: minYield,
          minDescription: minDescription,
          midIncome: midIncome,
          midExpense: midExpense,
          midYield: midYield,
          midDescription: midDescription,
          maxIncome: maxIncome,
          maxExpense: maxExpense,
          maxYield: maxYield,
          maxDescription: maxDescription,
          extra: {
            winLossRatio: margin / (midIncome - midExpense),
          },
        };
      }

      return new OptionYieldDto();
    });

    return yields.filter((y) => y.executionPrice > 0);
  }
}
