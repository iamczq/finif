import { Exclude, Expose, Transform } from 'class-transformer';
import { blackScholes } from 'src/util/black-scholes';

export class OptionRisk {
  type: 'C' | 'P';
  executionPrice: number;
  price: number;
  underlyingPrice: number;
  remainDays: number;
  @Exclude()
  readonly bs: blackScholes;
  readonly rate: number = 0.03;

  constructor(initializer: {
    type: 'C' | 'P';
    executionPrice: number;
    price: number;
    underlyingPrice: number;
    remainDays: number;
  }) {
    this.bs = new blackScholes();
    this.type = initializer.type;
    this.executionPrice = initializer.executionPrice;
    this.price = initializer.price;
    this.underlyingPrice = initializer.underlyingPrice;
    this.remainDays = initializer.remainDays;
  }

  @Expose()
  get iv(): number {
    return this.bs.getImpliedVolatility(
      this.type,
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.price,
    );
  }

  @Expose()
  get delta(): number {
    return this.bs.getDelta(
      this.type,
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.iv,
    );
  }

  @Expose()
  get gamma(): number {
    return this.bs.getGamma(
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.iv,
    );
  }

  @Expose()
  get theta(): number {
    return this.bs.getTheta(
      this.type,
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.iv,
    );
  }

  @Expose()
  get vega(): number {
    return this.bs.getVega(
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.iv,
    );
  }

  @Expose()
  public get rho(): number {
    return this.bs.getRho(
      this.type,
      this.underlyingPrice,
      this.executionPrice,
      this.remainDays,
      this.rate,
      this.iv,
    );
  }

  @Expose()
  get timeValue(): number {
    if (this.type === 'C') {
      return Math.min(this.executionPrice - this.underlyingPrice, 0) + this.price;
    } else if (this.type === 'P') {
      return Math.min(this.underlyingPrice - this.executionPrice, 0) + this.price;
    } else {
      return NaN;
    }
  }

  @Expose()
  get intrinsicValue(): number {
    return this.price - this.timeValue;
  }
}
