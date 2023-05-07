export class OptionQuoteDto {
  readonly code: string;
  readonly month: string;
  readonly type: 'C' | 'P';
  readonly executionPrice: number;
  readonly price: number;
  readonly buyVol: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly sellVol: number;
  readonly position: number;
  readonly changePercent: number;
  readonly underlyingPrice: number;
  readonly expireDays: number;

  constructor(initializer: {
    code: string;
    month: string;
    type: 'C' | 'P';
    executionPrice: number;
    price: number;
    buyVol: number;
    buyPrice: number;
    sellPrice: number;
    sellVol: number;
    position: number;
    changePercent: number;
    underlyingPrice: number;
    expireDays: number;
  }) {
    this.code = initializer.code;
    this.month = initializer.month;
    this.type = initializer.type;
    this.executionPrice = initializer.executionPrice;
    this.price = initializer.price;
    this.buyVol = initializer.buyVol;
    this.buyPrice = initializer.buyPrice;
    this.sellPrice = initializer.sellPrice;
    this.sellVol = initializer.sellVol;
    this.position = initializer.position;
    this.changePercent = initializer.changePercent;
    this.underlyingPrice = initializer.underlyingPrice;
    this.expireDays = initializer.expireDays;
  }
}
