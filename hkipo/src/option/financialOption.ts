import { IOption } from "./IOption";

export class FinancialOption implements IOption {
    code: string;
    executionPrice: number;
    price: number;
    buyVol: number;
    buyPrice: number;
    sellPrice: number;
    sellVol: number;
    position: number;
    changePercent: number;
    underlyingPrice: number;
    // _timeValue: number;
    // _intrinsicValue: number;
    // _delta: number;
    // _gamma: number;
    // _theta: number;
    // _vega: number;
    // _iv: number;

    constructor(initializer: {
        code: string,
        executionPrice: number,
        price: number,
        buyVol: number,
        buyPrice: number,
        sellPrice: number,
        sellVol: number,
        position: number,
        changePercent: number,
        underlyingPrice: number,
        // timeValue?: number,
        // intrinsicValue?: number,
        // delta?: number,
        // gamma?: number,
        // theta?: number,
        // vega?: number,
        // iv?: number,
    }) {
        this.code = initializer.code;initializer.code;
        this.executionPrice = initializer.executionPrice;
        this.price = initializer.price;
        this.buyVol = initializer.buyVol;
        this.buyPrice = initializer.buyPrice;
        this.sellPrice = initializer.sellPrice;
        this.sellVol = initializer.sellVol;
        this.position = initializer.position;
        this.changePercent = initializer.changePercent;
        this.underlyingPrice = initializer.underlyingPrice;
        // this.timeValue = initializer.timeValue;
        // this.intrinsicValue = initializer.intrinsicValue;
        // this.delta = initializer.delta;
        // this.gamma = initializer.gamma;
        // this.theta = initializer.theta;
        // this.vega = initializer.vega;
        // this.iv = initializer.iv;
    }
    
    timeValue(): number {
        return Math.min(this.executionPrice - this.underlyingPrice, 0) + this.price;
    }
}