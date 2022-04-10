import { TradeDirection } from './tradeDirection';

export class Trade {
    code: string; // '510300C2112M5000',
    direction: TradeDirection;
    price: number;
    quantity: number;
    fee: number;

    constructor(initializer: {
        code: string;
        direction: TradeDirection;
        price: number;
        quantity: number;
        fee?: number;
    }) {
        this.code = initializer.code;
        this.direction = initializer.direction;
        this.price = initializer.price;
        this.quantity = initializer.quantity;
        this.fee = initializer.fee ?? 0;
    }
}