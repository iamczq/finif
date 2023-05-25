export class OptionYieldDto {
  readonly description: string;
  readonly executionPrice: number;
  readonly margin: number;
  readonly duration: number;
  readonly minIncome: number;
  readonly minExpense: number;
  readonly minYield: number;
  readonly minDescription: string;
  readonly midIncome: number;
  readonly midExpense: number;
  readonly midYield: number;
  readonly midDescription: string;
  readonly maxIncome: number;
  readonly maxExpense: number;
  readonly maxYield: number;
  readonly maxDescription: string;
  readonly extra?: any;
}
