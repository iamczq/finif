import fetch from 'node-fetch';
import {IOptionPair } from './IOption';
import * as iconv from "iconv-lite";
import chalk from "chalk";
import { SinaEtfOptionProvider } from './sina300EtfOptionProvider';
import { Sina300IndexOptionProvider } from './sina300IndexOptionProvider';
import moment from 'moment';
import { SyntheticSpotPositionWatcher } from './position/syntheticSpotPositionWatcher';
import { SyntheticSpotPosition, SyntheticSpotPositionTypes } from './position/syntheticSpotPosition';
import { PositionStatus } from './position/positionStatus';
import { TradeDirection } from '../trade/tradeDirection';

export class OptionCalculator {

    public async main(): Promise<void> {
        const futuresPromise: { [contract: string]: Promise<string> } = {};
        const etfOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        const indexOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        let contract = '';

        contract = '2209';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        contract = '2206';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        contract = '2205';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        contract = '2204';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        // await this.watchMyPosition(etfOptionsPromise, indexOptionsPromise);

        // await this.get50Etf();

        // await this.analyzeIC500();
    }

    public calculatePremium(futuresPromise: Promise<string>, optionsPromise: Promise<IOptionPair[]>): Promise<void> {
        return Promise.all([futuresPromise, optionsPromise])
            .then(respone => {
                // console.log(chalk.green(`${contract}: ${source}`));

                // 1. Futures
                const futures: string = respone[0] || '';
                const hqString: string = futures.substring(futures.indexOf('=') + 1);
                const hqArray = hqString.split(',');
                const futurePrice = parseFloat(hqArray[3]);

                // 2. Options
                const callPutPairs = respone[1];
                const shortPremiumList = callPutPairs.map(pair => {
                    const call = pair.call;
                    const put = pair.put;

                    let shortOption;
                    let longOption;
                    if (call === undefined || put === undefined) {
                        shortOption = NaN;
                        longOption = NaN;
                    } else if (call.buyPrice == 0 || put.sellPrice == 0) {
                        shortOption = NaN;
                        longOption = NaN;
                    } else {
                        shortOption = call.buyPrice - put.sellPrice + call.executionPrice;
                        // console.log(call.buyPrice, put.sellPrice, call.executionPrice, call.underlyingPrice);
                        longOption = - call.sellPrice + put.buyPrice - call.executionPrice;
                    }
                    return {
                        'code': call.code,
                        'shortOption': shortOption,
                        'longOption': longOption,
                        'shortPremium': Math.round((shortOption - call.underlyingPrice) * 100) / 100,
                        'longPremium': Math.round((call.underlyingPrice + longOption) * 100) / 100,
                        underlyingPrice: call.underlyingPrice
                    };
                }).filter(p => !Number.isNaN(p.shortOption));

                shortPremiumList
                    // Sort at liquidity
                    .sort((a, b) => (a.shortOption + a.longOption) - (b.shortOption + b.longOption))
                    .forEach(p => {
                        console.log(`${p.code}: Short at ${p.shortOption}, Underlying at ${p.underlyingPrice}. Short premium: ${p.shortPremium}. Long premium: ${p.longPremium}`);
                    });

                const longPremiumList = callPutPairs.map(pair => {
                    const call = pair.call;
                    const put = pair.put;

                    let longPremium;
                    if (call === undefined || put === undefined) {
                        longPremium = NaN;
                    } else if (call.buyPrice == 0 || put.sellPrice == 0) {
                        longPremium = NaN;
                    } else {
                        longPremium = - call.sellPrice + put.buyPrice - call.executionPrice;
                        // console.log(call.sellPrice, put.buyPrice, call.executionPrice);
                    }
                    return {
                        'code': call.code,
                        'longPremium': longPremium,
                    };
                }).filter(p => !Number.isNaN(p.longPremium));

                longPremiumList
                    .sort((a, b) => a.longPremium - b.longPremium)
                    .forEach(p => {
                        // console.log(`${p.code}: Long at ${p.longPremium}, short at ${futurePrice}. Premium: ${Math.round((futurePrice + p.longPremium) * 100) / 100}`);
                    });
            });
    }

    private watchMyPosition(
        etfOptionsPromise: { [contract: string]: Promise<IOptionPair[]> },
        indexOptionsPromise: { [contract: string]: Promise<IOptionPair[]> },
    ) {
        console.log(chalk.green(`Watch my position:`));

        const etf2112 = etfOptionsPromise['2112'];
        const etf2109 = etfOptionsPromise['2109'];
        const etf2107 = etfOptionsPromise['2108'];
        const etf2106 = etfOptionsPromise['2107'];
        const index2106 = indexOptionsPromise['2107'];
        const index2112 = indexOptionsPromise['2112'];

        Promise.all([etf2112, etf2109, etf2107, etf2106, index2106, index2112]).then(response => {
            const x = response.reduce((prev, current) => {
                return prev.concat(current);
            });

            // response[0].concat(response[1]).concat(response[2]).concat(response[3]);

            x.forEach(resp => {
                if (resp.code === 'io2107C5200') {
                    console.log('aaaaaaaaaaaaaaaaaa', resp.call.remainDays);
                    
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue} price: ${resp.call.price}`);
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2107M5250') {
                    console.log('bbbbbbbbbbbbbbbbbbb', resp.call.remainDays);
                    console.log(`${this.directionString('S')}: ${resp.code} time value: ${resp.call.timeValue} price: ${resp.call.price}`);
                }
            });

            x.forEach(resp => {
                if (resp.code === 'io2107C5500') {
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue} price: ${resp.call.price}`);
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2107M5500') {
                    console.log(`${this.directionString('S')}: ${resp.code} time value: ${resp.call.timeValue} price: ${resp.call.price}`);
                }
            });

            console.log('----------------------------------------');
            let timeValueFront = 0;
            let timeValueNext = 0;
            let timeValueFar = 0;
            x.forEach(resp => {
                if (resp.code === '510300C2107M5000') {
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue}`);
                    timeValueFront = resp.call.timeValue;
                }

                if (resp.code === '510300C2108M5000') {
                    console.log(`${this.directionString('S')}: ${resp.code} time value: ${resp.call.timeValue}`);
                    timeValueNext = resp.call.timeValue;
                }

                if (resp.code === '510300C2109M5000') {
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue}`);
                    timeValueFar = resp.call.timeValue;
                }
            });
            console.log(`Time value delta AUG - JULY: ${timeValueNext - timeValueFront}. (It was 32 on JUN 24th. Last time change: 65.)`);
            console.log(`Time value delta SEP - JULY: ${timeValueFar - timeValueFront}. (It was 58 on JUN 20th)`);

            console.log('----------------------------------------');
            let nearShortOppositePrice = 0;
            let farLongOppositePrice = 0;
            let nearShortCurrentPrice = 0;
            let farLongCurrentPrice = 0;
            let nearLongOppositePrice = 0;
            let farShortOppositePrice = 0;
            let nearUnderlying = 0;
            let farUnderlying = 0;
            x.forEach(resp => {
                if (resp.code === '510300C2108M5500') {
                    console.log(`${this.directionString('S')}: ${resp.call.code} time value: ${resp.call.timeValue}. Buy Price: ${resp.call.buyPrice}. Sell Price: ${resp.call.sellPrice}`);
                    console.log(`${this.directionString('B')}: ${resp.put.code} time value: ${resp.put.timeValue}. Buy Price: ${resp.put.buyPrice}. Sell Price: ${resp.put.sellPrice}`);
                    const changeShortOppositePrice = - resp.put.sellPrice + resp.call.buyPrice + resp.call.executionPrice - resp.call.underlyingPrice;
                    const changeLongOppositePrice = resp.put.buyPrice - resp.call.sellPrice - resp.call.executionPrice + resp.call.underlyingPrice;
                    console.log(`What if change ${resp.code}`, changeShortOppositePrice, changeShortOppositePrice);
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2107M5500') {
                    console.log(`${this.directionString('S')}: ${resp.call.code} time value: ${resp.call.timeValue}. Buy Price: ${resp.call.buyPrice}. Sell Price: ${resp.call.sellPrice}`);
                    console.log(`${this.directionString('B')}: ${resp.put.code} time value: ${resp.put.timeValue}. Buy Price: ${resp.put.buyPrice}. Sell Price: ${resp.put.sellPrice}`);
                    nearShortOppositePrice = - resp.put.sellPrice + resp.call.buyPrice + resp.call.executionPrice - resp.call.underlyingPrice;
                    nearLongOppositePrice = resp.put.buyPrice - resp.call.sellPrice - resp.call.executionPrice + resp.call.underlyingPrice;
                    nearShortCurrentPrice = - resp.put.price + resp.call.price + resp.call.executionPrice - resp.call.underlyingPrice;
                    nearUnderlying = resp.call.underlyingPrice;
                }
            });

            x.forEach(resp => {
                if (resp.code === 'io2107C5000') {
                    console.log(`${this.directionString('B')}: ${resp.call.code} time value: ${resp.call.timeValue}. Buy Price: ${resp.call.buyPrice}. Sell Price: ${resp.call.sellPrice}`);
                    console.log(`${this.directionString('S')}: ${resp.put.code} time value: ${resp.put.timeValue}. Buy Price: ${resp.put.buyPrice}. Sell Price: ${resp.put.sellPrice}`);
                    farLongOppositePrice = - resp.call.sellPrice + resp.put.buyPrice - resp.call.executionPrice + resp.call.underlyingPrice;
                    farLongCurrentPrice = - resp.call.price + resp.put.price - resp.call.executionPrice + resp.call.underlyingPrice;
                    farShortOppositePrice = resp.call.buyPrice - resp.put.sellPrice + resp.call.executionPrice - resp.call.underlyingPrice;
                    farUnderlying = resp.call.underlyingPrice;
                }
            });

            console.log(`Opposite price open: total ${(nearShortOppositePrice + farLongOppositePrice).toFixed(2)}, near ${nearShortOppositePrice.toFixed(2)}, far ${farLongOppositePrice.toFixed(2)}`);
            console.log(`Current price open: total ${(nearShortCurrentPrice + farLongCurrentPrice).toFixed(2)}, near ${nearShortCurrentPrice.toFixed(2)}, far ${farLongCurrentPrice.toFixed(2)}`);
            console.log(`Opposite price close: total ${(nearLongOppositePrice + farShortOppositePrice).toFixed(2)}, near ${nearLongOppositePrice.toFixed(2)}, far ${farShortOppositePrice.toFixed(2)}`);
            console.log(`Underlying, near: ${nearUnderlying}, far: ${farUnderlying}, differences: ${(nearUnderlying - farUnderlying).toFixed(2)}`);

            console.log('----------------------------------------');
            this.watchSyntheticSpotPosition(x);

            console.log('----------------------------------------');
            this.watchCalendarSpreadPosition(x);

            console.log('---------------------------------------');
            x.forEach(resp => {
                if (resp.code === 'io2107C5000') {
                    const buyCall = - resp.call.sellPrice;
                    const sellPut = resp.put.buyPrice;
                    const open = buyCall + sellPut;
                    const  close = -36.4 + 78.2;
                    console.log(`---${resp.code}---`);
                    console.log('Buy call', buyCall, 'Sell put', sellPut);
                    console.log('开仓', open);
                    console.log('平仓', close);
                    console.log('total', open + close);
                }
            });

            x.forEach(resp => {
                if (resp.code === 'io2107C5100') {
                    const buyCall = - resp.call.sellPrice;
                    const sellPut = resp.put.buyPrice;
                    const open = buyCall + sellPut;
                    const  close = -115.8 + 24.4;
                    console.log(`---${resp.code}---`);
                    console.log('Buy call', buyCall, 'Sell put', sellPut);
                    console.log('开仓', open);
                    console.log('平仓', close);
                    console.log('total', open + close);
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2107M5500') {
                    const sellCall = resp.call.buyPrice;
                    const buyPut = - resp.put.sellPrice;
                    const open = sellCall + buyPut;
                    const close =  393.5 - 5.1;

                    console.log('Sell call', resp.call.buyPrice, 'Buy put', - resp.put.sellPrice);
                    console.log('开仓', open);
                    console.log('平仓', close);
                    console.log('total', open + close);
                }
            });
        });
    }

    private async getFutures(contract: string) {
        const req = await fetch(`https://hq.sinajs.cn/?list=nf_IF${contract}`, {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "max-age=0",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "referer": "http://finance.sina.com.cn",
            },
            "method": "GET",
        });

        return req.text();
    }

    private async getSina300IndexOptions(contract: string): Promise<IOptionPair[]> {
        const provider = new Sina300IndexOptionProvider(contract);
        return provider.getData();
    }

    public async getSina300EtfOptions(contract: string): Promise<IOptionPair[]> {
        const provider = new SinaEtfOptionProvider('510300', contract);
        return provider.getData();
    }

    public async getSina50EtfOptions(contract: string): Promise<IOptionPair[]> {
        const provider = new SinaEtfOptionProvider('510050', contract);
        return provider.getData();
    }

    private async getEastMoney300EtfOptions(contract: string) {
        const req = await fetch(`http://push2.eastmoney.com/api/qt/slist/get?secid=1.510300&exti=20${contract}&spt=9&fltt=2&invt=2&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f1%2Cf2%2Cf3%2Cf4%2Cf5%2Cf12%2Cf13%2Cf14%2Cf108%2Cf152%2Cf161%2Cf249%2Cf250%2Cf330%2Cf334%2Cf339%2Cf340%2Cf341%2Cf342%2Cf343%2Cf344%2Cf345%2Cf346%2Cf347&fid=f161&pn=1&pz=20&po=0&_=1618148050691`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "cookie": "qgqp_b_id=971160c5685ffc1cb64d6ebcae6d7b11; st_si=42096067962435; st_pvi=45265308412505; st_sp=2021-04-11%2019%3A18%3A57; st_inirUrl=https%3A%2F%2Fwww.baidu.com%2Flink; st_sn=1; st_psi=20210411213414415-113200301321-0791314576; st_asi=delete"
            },
            "method": "GET",
        });

        const resp = await req.json();

        console.log(resp);

        // f11: 5120 买五
        // f12: 1
        // f13: 5182
        // f14: 1
        // f15: 5210
        // f16: 1
        // f17: 5225
        // f18: 5
        // f19: 5235 买一
        // f20: 5
        // f31: 5426 卖五
        // f32: 1
        // f33: 5416
        // f34: 1
        // f35: 5316
        // f36: 1
        // f37: 5281
        // f38: 1
        // f39: 5254 卖一
        // f40: 1
        fetch("http://push2.eastmoney.com/api/qt/stock/get?secid=10.10003319&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f531,f57,f58,f59,f107,f179,f43,f44,f45,f46,f47,f48,f58,f50,f51,f52,f60,f71,f86,f130,f131,f132,f133,f134,f152,f169,f170,f171,f403,f407,f408,f409,f410,f411,f412,f413,f414,f415,f416,f417,f418,f481&invt=2&cb=jQuery112402846196679331734_1618153460696&_=1618153460697", {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "cookie": "qgqp_b_id=971160c5685ffc1cb64d6ebcae6d7b11; st_si=14522502747047; st_pvi=45265308412505; st_sp=2021-04-11%2019%3A18%3A57; st_inirUrl=https%3A%2F%2Fwww.baidu.com%2Flink; st_sn=18; st_psi=20210411225617870-113200301356-4361791586; st_asi=20210411225617870-113200301356-4361791586-dfcfwsy_dfcfwxsy_ycl_ewmxt-1"
            },
            "method": "GET",
        });
    }

    public async get50Etf(): Promise<void> {

        const req = await fetch(`https://hq.sinajs.cn/list=s_sh510050`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site",
                "referer": "http://finance.sina.com.cn",
            },
            "method": "GET",
        });

        const rawCallBuffer = await req.buffer();
        const rawCall = iconv.decode(rawCallBuffer, 'GB18030');
        const regUnderlying = /(?<=hq_str_s_sh510050=").*?(?=")/gmi;
        const underlying = rawCall.match(regUnderlying) || ['Regex failed'];

        console.log(chalk.red(`${underlying}`));
    }

    private directionString(direction: 'B' | 'S') {
        if (direction === 'B') {
            return chalk.red('BUY');
        }

        if (direction === 'S') {
            return chalk.green('SELL');
        }
    }

    public async analyzeFutures(type: 'IC' | 'IF' | 'IH'): Promise<void> {
        let contract;
        let regIc;
        let regIndex;
        switch (type) {
            case 'IC':
                contract = 'sh000905,nf_IC2204,nf_IC2205,nf_IC2206,nf_IC2209';
                regIc = /(?<=var hq_str_nf_IC.*?=").*?(?=")/gmi;
                regIndex = /(?<=hq_str_sh000905=").*?(?=")/gmi;
                break;
            case 'IF':
                contract = 'sh000300,nf_IF2204,nf_IF2205,nf_IF2206,nf_IF2209';
                regIc = /(?<=var hq_str_nf_IF.*?=").*?(?=")/gmi;
                regIndex = /(?<=hq_str_sh000300=").*?(?=")/gmi;
                break;
            case 'IH':
                contract = 'sh000016,nf_IH2204,nf_IH2205,nf_IH2206,nf_IH2209';
                regIc = /(?<=var hq_str_nf_IH.*?=").*?(?=")/gmi;
                regIndex = /(?<=hq_str_sh000016=").*?(?=")/gmi;
                break;
            default:
                throw new Error('Not valid futures');
        }
        const months = ['2022-04', '2022-05', '2022-06', '2022-09'];

        const req = await fetch(`https://hq.sinajs.cn/?list=${contract}`, {
            "method": "GET",
            "headers": {
                "referer": "http://finance.sina.com.cn",
            }
        });

        const resp = iconv.decode(await req.buffer(), 'GB18030');
        const matchIc = resp.match(regIc) || ['Regex failed'];

        const thisMonthPrice = parseFloat(matchIc[0].split(',')[3]);
        const nextMonthPrice = parseFloat(matchIc[1].split(',')[3]);
        const nextQuarterPrice = parseFloat(matchIc[2].split(',')[3]);
        const otherQuarterPrice = parseFloat(matchIc[3].split(',')[3]);

        const matchIndex = resp.match(regIndex) || ['Regex failed'];
        const index500 = parseFloat(matchIndex[0].split(',')[3]);

        const now = moment();
        const thisMonthDelivery = moment(months[0]).day(14 + 5);
        const nextMonthDelivery = moment(months[1]).day(14 + 5);
        const nextQuarterDelivery = moment(months[2]).day(14 + 5);
        const otherQuarterDelivery = moment(months[3]).day(14 + 5);

        const daysThisMonth = moment.duration(thisMonthDelivery.diff(now)).asDays();
        const daysNextMonth = moment.duration(nextMonthDelivery.diff(now)).asDays();
        const daysNextQuarter = moment.duration(nextQuarterDelivery.diff(now)).asDays();
        const daysOtherQuarter = moment.duration(otherQuarterDelivery.diff(now)).asDays();

        console.log(`${index500}, ${index500 * 200 * 0.17}`);
        console.log(`This M ${thisMonthPrice}, ${index500 - thisMonthPrice}, AVG: ${(index500 - thisMonthPrice) / daysThisMonth}`);
        console.log(`Next M ${nextMonthPrice}, ${index500 - nextMonthPrice}, AVG: ${(index500 - nextMonthPrice) / daysNextMonth}`);
        console.log(`Next Q ${nextQuarterPrice}, ${index500 - nextQuarterPrice}, AVG: ${(index500 - nextQuarterPrice) / daysNextQuarter}`);
        console.log(`Other Q ${otherQuarterPrice}, ${index500 - otherQuarterPrice}, AVG: ${(index500 - otherQuarterPrice) / daysOtherQuarter}`);
    }

    // TODO: Not implemented
    public getRemainDays(): number {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const quaters = [2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2]; // 2 months, 1 month, 3 months

        const currentYear = moment().year();
        const currentMonth = moment().month() + 1;

        console.log(currentYear, currentMonth, months[currentMonth]);

        const now = moment();
        const thisMonthDeliveryDate = moment().startOf('month').day(14 + 5).add(1, 'day');

        let frontMonth;
        if (thisMonthDeliveryDate > now) {
            frontMonth = currentMonth;
        } else {
            frontMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        }

        console.log(currentMonth);
        console.log(frontMonth);



        for (let index = 1; index <= 12; index++) {
            const monthString = '2021-' + (index > 9 ? '' : '0') + index;
            console.log(monthString);

            const monthsToAdd = quaters[index - 1 + 1];
            console.log(index, monthsToAdd,
                moment(monthString).format('yyyy-MM'),
                moment(monthString).add(1, 'month').format('yyyy-MM'),
                moment(monthString).add(1, 'month').add(monthsToAdd, 'month').format('yyyy-MM'),
                moment(monthString).add(1, 'month').add(monthsToAdd, 'month').add(3, 'month').format('yyyy-MM'));
        }



        const futureExpireDay = moment('2021-07').day(14 + 5);
        const remainDays = futureExpireDay.diff(moment(), 'days');

        return remainDays;
    }

    // TODO: Not implemented
    public getCurrentContracts(): string[] {
        const now = moment('2021-08');

        // console.log(now, now.date());
        for (let index = 0; index < 30; index++) {
            console.log(index, moment('2021-07').day(index));
        }

        if (now > now.day(14 + 5)) {
            console.log(11);
        } else {
            console.log(22);
        }

        return [];
    }

    public async analyze50etf(): Promise<void> {
        const futuresPromise: { [contract: string]: Promise<string> } = {};
        const etfOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        const indexOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        let contract = '';
        const x = new Promise<string>((resolve, reject) => {
            setTimeout(resolve, 0);
        });

        contract = '2209';
        etfOptionsPromise[contract] = this.getSina50EtfOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(x, etfOptionsPromise[contract]);

        contract = '2206';
        etfOptionsPromise[contract] = this.getSina50EtfOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(x, etfOptionsPromise[contract]);

        contract = '2205';
        etfOptionsPromise[contract] = this.getSina50EtfOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(x, etfOptionsPromise[contract]);

        contract = '2204';
        etfOptionsPromise[contract] = this.getSina50EtfOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(x, etfOptionsPromise[contract]);
    }

    private watchSyntheticSpotPosition(allOptions: IOptionPair[]) {
        const positions: SyntheticSpotPosition[] = [];
        
        positions.push(new SyntheticSpotPosition({
            contract: '510300C2112M5000',
            type: SyntheticSpotPositionTypes.Long,
            status: PositionStatus.Active,
            trade: [{
                code: '510300C2112M5000',
                direction: TradeDirection.Buy,
                price: 0.3530 * 1000,
                quantity: 10 * 10,
                fee: 0,
            }, {
                code: '510300P2112M5000',
                direction: TradeDirection.Sell,
                price: 0.1852 * 1000,
                quantity: 10 * 10,
                fee: 0,
            }],
        }));

        positions.push(new SyntheticSpotPosition({
            contract: '510300C2107M5500',
            type: SyntheticSpotPositionTypes.Short,
            status: PositionStatus.Active,
            trade: [{
                code: '510300P2107M5500',
                direction: TradeDirection.Buy,
                price: 0.3335 * 1000,
                quantity: 10 * 10,
                fee: 0,
            }, {
                code: '510300C2107M5500',
                direction: TradeDirection.Sell,
                price: 0.01585 * 1000,
                quantity: 10 * 10,
                fee: 0,
            }],
        }));

        const watcher: SyntheticSpotPositionWatcher = new SyntheticSpotPositionWatcher(positions);
        watcher.watch(allOptions);
    }

    private watchCalendarSpreadPosition(allOptions: IOptionPair[]) {
        // TODO: For now, use the SyntheticSpotPosition.
        const positions: SyntheticSpotPosition[] = [];

        positions.push(new SyntheticSpotPosition({
            contract: '510300C2109M5000',
            type: SyntheticSpotPositionTypes.Long,
            status: PositionStatus.Active,
            trade: [{
                code: '510300C2109M5000',
                direction: TradeDirection.Buy,
                price: 0.2582 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }],
        }));

        positions.push(new SyntheticSpotPosition({
            contract: '510300C2105M5000',
            type: SyntheticSpotPositionTypes.Short,
            status: PositionStatus.Close,
            trade: [{
                code: '510300C2105M5000',
                direction: TradeDirection.Sell,
                price: 0.1172 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }, {
                code: '510300C2105M5000',
                direction: TradeDirection.Buy,
                price: 0.3218 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }],
        }));

        positions.push(new SyntheticSpotPosition({
            contract: '510300C2106M5000',
            type: SyntheticSpotPositionTypes.Short,
            status: PositionStatus.Close,
            trade: [{
                code: '510300C2106M5000',
                direction: TradeDirection.Sell,
                price: 0.3518 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }, {
                code: '510300C2106M5000',
                direction: TradeDirection.Buy,
                price: 0.1447 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }],
        }));

        positions.push(new SyntheticSpotPosition({
            contract: '510300C2107M5000',
            type: SyntheticSpotPositionTypes.Short,
            status: PositionStatus.Active,
            trade: [{
                code: '510300C2107M5000',
                direction: TradeDirection.Sell,
                price: 0.2113 * 1000,
                quantity: 1 * 10,
                fee: 0,
            }],
        }));

        const watcher: SyntheticSpotPositionWatcher = new SyntheticSpotPositionWatcher(positions);
        watcher.watch(allOptions);
    }

}