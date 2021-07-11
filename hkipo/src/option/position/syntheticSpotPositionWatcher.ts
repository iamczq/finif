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
            return obj.status === PositionStatus.Open;
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

                    // TODO: The multiplier is hard-coded.
                    const closeReturn = 100 * worstPrice * direction;

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
}