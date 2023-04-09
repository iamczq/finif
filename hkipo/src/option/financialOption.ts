import moment from "moment";
import { IOption } from "./IOption";
import { UnderlyingType } from "./underlyingType";
import { blackScholes } from "./blackScholes";
import { Calendar } from "../util/calendar";

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
    readonly bs: blackScholes;
    readonly rate: number = 0.03;

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

        this.bs = new blackScholes();
    }

    get delta(): number {
        return this.bs.getDelta(this.type, this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.iv);
    }

    get gamma(): number {
        return this.bs.getGamma(this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.iv);
    }

    get theta(): number {
        return this.bs.getTheta(this.type, this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.iv);
    }

    get vega(): number {
        return this.bs.getVega(this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.iv);
    }

    public get rho(): number {
        return this.bs.getRho(this.type, this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.iv);
    }

    get iv(): number {
        return this.bs.getImpliedVolatility(this.type, this.underlyingPrice, this.executionPrice, this.remainDays, this.rate, this.price);
    }

    get timeValue(): number {
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

    get intrinsicValue(): number {
        return this.price - this.timeValue;
    }
    
    public get expireDay() : moment.Moment {
        if (this.underlyingType === UnderlyingType.ETF) {
            return Calendar.getExpireDate(this.month, 4, 3);
        } else {
            return Calendar.getExpireDate(this.month, 3, 5);
        }
    }

    public get remainDays(): number {
        const futureExpireDay = this.expireDay;
        const today = moment(moment().format('YYYY-MM-DD'));
        const remainDays = futureExpireDay.diff(today, 'days');

        return remainDays;
    }

    get underlyingType(): UnderlyingType {
        const isIndex = this.code.indexOf('io') === 0;
        const isEtf = this.code.search(/^\d/) === 0;
        let underlyingType;

        if (isIndex) {
            underlyingType = UnderlyingType.Index;
        } else if (isEtf) {
            underlyingType = UnderlyingType.ETF;
        } else {
            throw new Error(`Invalid code ${this.code}`);
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
        if (this.underlyingType === UnderlyingType.ETF) {
            multiplier = 1000;
        } else {
            multiplier = 1;
        }

        return multiplier;
    }
}