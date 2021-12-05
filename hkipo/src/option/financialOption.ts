import moment from "moment";
import { IOption } from "./IOption";
import { UnderlyingType } from "./underlyingType";

export class FinancialOption implements IOption {
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
    // _timeValue: number;
    // _intrinsicValue: number;
    // _delta: number;
    // _gamma: number;
    // _theta: number;
    // _vega: number;
    // _iv: number;

    constructor(initializer: {
        code: string,
        month: string,
        type: 'C' | 'P',
        executionPrice: number,
        price: number,
        buyVol: number,
        buyPrice: number,
        sellPrice: number,
        sellVol: number,
        position: number,
        changePercent: number,
        underlyingPrice: number,
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
        // this.timeValue = initializer.timeValue;
        // this.intrinsicValue = initializer.intrinsicValue;
        // this.delta = initializer.delta;
        // this.gamma = initializer.gamma;
        // this.theta = initializer.theta;
        // this.vega = initializer.vega;
        // this.iv = initializer.iv;
    }

    // TODO
    delta(): number {
        return 0;
    };

    timeValue(): number {
        // console.log(this.code, this.executionPrice, this.underlyingPrice, this.price);

        let callPut;
        if (this.code.toUpperCase().indexOf('C') > 0) {
            callPut = 'C';
        } else if (this.code.toUpperCase().indexOf('P') > 0) {
            callPut = 'P';
        } else {
            console.log(`Wrong code: ${this.code}`);
        }

        if (callPut === 'C') {
            return Math.min(this.executionPrice - this.underlyingPrice, 0) + this.price;
        } else if (callPut === 'P') {
            return Math.min(this.underlyingPrice - this.executionPrice, 0) + this.price;
        } else {
            return NaN;
        }
    }

    // TODO: Not implemented?
    public remainDays(): number {
        const month = '20' + this.month.substring(0,2) + '-' + this.month.substring(2,4);
        let days;
        // If the first day of this month > Wednesday.
        // moment(month)                  > moment(month).day(3)
        if (moment(month).day(3) < moment(month)) {
            days = 28 + 3;
        } else {
            days = 21 + 3;
        }
        
        const futureExpireDay = moment(month).day(days);
        const today = moment(moment().format('YYYY-MM-DD'));
        const remainDays = futureExpireDay.diff(today, 'days');

        return remainDays;
    }

    underlyingType(): UnderlyingType {
        const isIndex = this.code.indexOf('io') === 0;
        const isEtf = this.code.search(/^\d/) === 0;
        let underlyingType;

        if (isIndex) {
            underlyingType = UnderlyingType.Index;
        } else if (isEtf) {
            underlyingType = UnderlyingType.ETF;
        } else {
            throw new Error(`Invlid code ${this.code}`);
        }

        return underlyingType;
    }

    /**
     * 价格转化为指数点的乘数。例如，
     * etf期权价格是0.1000，此方法应返回1000，即0.1 * 1000 = 100个指数点。
     * 对于指数期权，返回1，因为指数期权的价格就是指数点。
     */
    multiplierFromPriceToIndexPoint(): number {
        let multiplier;
        if (this.underlyingType() === UnderlyingType.ETF) {
            multiplier = 1000;
        } else {
            multiplier = 1;
        }

        return multiplier;
    }
}