import chalk, { strikethrough } from "chalk";
import { TradeDirection } from "../../trade/tradeDirection";
import { IOption, IOptionPair } from "../IOption";
import { PositionStatus } from "./positionStatus";
import { SyntheticSpotPosition, SyntheticSpotPositionTypes } from "./syntheticSpotPosition";

export class SyntheticSpotPositionWatcher {
    private position: SyntheticSpotPosition[];

    constructor(position: SyntheticSpotPosition[]) {
        this.position = position;
    }

    public watch(allOptions: IOptionPair[]) {
        const longCost = this.getCost();
        const closeReturn = this.getCloseReturn(allOptions);
        const total = longCost + closeReturn;

        console.log('Open position cost: ', longCost);
        console.log('Close posiiton get: ', closeReturn);
        console.log('If now close position: ', total);

        const shortAt = this.getShortCost();
        const closeShort = this.getCloseShortReturn(allOptions);
        const shortProfit = shortAt + closeShort;
        const shortUnderlying = this.getShortUnderlying(allOptions);
        const closeShortPremium = closeShort + shortUnderlying;
        console.log(`Short ${this.getCloseShortContract()} at ${shortAt}, close should pay ${closeShort}, now underlying is ${shortUnderlying}.
        PnL: profit ${shortProfit}. premium ${closeShortPremium}.`);

        const longAt = this.getLongCost();
        const closeLong = this.getCloseLongReturn(allOptions);
        const longProfit = longAt + closeLong;
        const longUnderlying = this.getLongUnderlying(allOptions);
        const closeLongPremium = closeLong - longUnderlying;
        console.log(`Long ${this.getCloseLongContract()} at ${longAt}, close will get ${closeLong}, now underlying is ${longUnderlying}.
        PnL: profit ${longProfit}. premium ${closeLongPremium}.`);
    }

    private getShortCost(): number {
        const shortPosition = this.position.filter(pos => pos.isShort() && pos.isActive());
        const shortTrade = shortPosition.flatMap(pos => pos.trade);
        const amountArray = shortTrade.map(trade => trade.price * trade.quantity * trade.direction / trade.quantity);
        const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue;
        const amount = amountArray.reduce(reducer);

        const excutionPrice = this.getExcutionPrice(shortPosition[0].contract);

        return amount + excutionPrice;
    }

    private getCloseShortReturn(allOptions: IOptionPair[]): number {
        const shortPosition = this.position.filter(pos => pos.isShort() && pos.isActive());
        // TODO: What if length === 0?
        const contract = shortPosition[0].contract;
        const targetOption = allOptions.filter(optionPair => optionPair.code === contract);
        // TODO: What if length === 0?
        const optionPair = targetOption[0];
        const closeShortReturn = - optionPair.call.sellPrice + optionPair.put.buyPrice - optionPair.call.executionPrice;

        return closeShortReturn;
    }

    private getCloseShortContract(): string {
        const shortPosition = this.position.filter(pos => pos.isShort() && pos.isActive());
        // TODO: What if length === 0?
        return shortPosition[0].contract;
    }

    private getShortUnderlying(allOptions: IOptionPair[]): number {
        const shortPosition = this.position.filter(pos => pos.isShort() && pos.isActive());
        // TODO: What if length === 0?
        const contract = shortPosition[0].contract;
        const targetOption = allOptions.filter(optionPair => optionPair.code === contract);
        // TODO: What if length === 0?
        const optionPair = targetOption[0];

        return optionPair.call.underlyingPrice;
    }

    private getLongCost(): number {
        const longPosition = this.position.filter(pos => pos.isLong() && pos.isActive());
        const longTrade = longPosition.flatMap(pos => pos.trade);
        const amountArray = longTrade.map(trade => trade.price * trade.quantity * trade.direction / trade.quantity);
        const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue;
        const amount = amountArray.reduce(reducer);

        const excutionPrice = this.getExcutionPrice(longPosition[0].contract);

        return amount - excutionPrice;
    }

    private getCloseLongReturn(allOptions: IOptionPair[]): number {
        const longPosition = this.position.filter(pos => pos.isLong() && pos.isActive());
        // TODO: What if length === 0?
        const contract = longPosition[0].contract;
        const targetOption = allOptions.filter(optionPair => optionPair.code === contract);
        // TODO: What if length === 0?
        const optionPair = targetOption[0];
        const closeLongReturn = optionPair.call.buyPrice - optionPair.put.sellPrice + optionPair.call.executionPrice;

        return closeLongReturn;
    }

    private getCloseLongContract(): string {
        const longPosition = this.position.filter(pos => pos.isLong() && pos.isActive());
        // TODO: What if length === 0?
        return longPosition[0].contract;
    }

    private getLongUnderlying(allOptions: IOptionPair[]): number {
        const longPosition = this.position.filter(pos => pos.isLong() && pos.isActive());
        // TODO: What if length === 0?
        const contract = longPosition[0].contract;
        const targetOption = allOptions.filter(optionPair => optionPair.code === contract);
        // TODO: What if length === 0?
        const optionPair = targetOption[0];

        return optionPair.call.underlyingPrice;
    }

    private getCost(): number {
        const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue;

        let cost = 0;
        this.position.forEach(pos => {
            cost = cost + pos.trade.map(trade => {
                const amount = trade.price * trade.quantity * trade.direction;
                console.log(trade.code, trade.direction, amount);
                return amount;
            }).reduce(reducer);
        });

        return cost;
    }

    private getCloseReturn(allOptions: IOptionPair[]) {
        const openPosition = this.position.filter(obj => {
            return obj.status === PositionStatus.Active;
        });

        const allTrade = openPosition.flatMap(position => {
            return position.trade;
        });

        const flatOptions = this.getOptionsFromOptionPair(allOptions);

        let sum = 0;
        allTrade.forEach(trade => {
            const code = trade.code;
            const direction = trade.direction * -1;
            const quantity = trade.quantity;

            flatOptions.forEach(option => {
                if (option.code === code) {
                    let worstPrice;
                    if (direction === TradeDirection.Buy) {
                        worstPrice = option.sellPrice;
                    } else if (direction === TradeDirection.Sell) {
                        worstPrice = option.buyPrice;
                    } else {
                        throw new Error("Direction is neither BUY nor SELL.");
                    }

                    const closeReturn = quantity * worstPrice * direction;

                    sum = sum + closeReturn;
                    console.log(`${this.directionString(direction)}: ${option.code} close return: ${closeReturn}`);
                }
            });
        });

        return sum;
    }

    private getOptionsFromOptionPair(pairs: IOptionPair[]) {
        const flatOptions: IOption[] = pairs.flatMap(pair => {
            return [pair.call, pair.put];
        });

        return flatOptions;
    }

    private directionString(direction: TradeDirection) {
        let str = '';

        if (direction === TradeDirection.Buy) {
            str = chalk.red('BUY');
        } else if (direction === TradeDirection.Sell) {
            str = chalk.green('SELL');
        } else {
            str = '';
        }

        return str;
    }

    // TODO: Move to util
    private getExcutionPrice(contract: string) {
        // TODO: Can be 5 digits in the future.
        return parseFloat(contract.slice(-4));
    }
}