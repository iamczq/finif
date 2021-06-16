import fetch from 'node-fetch';
import { IOption, IOptionPair } from './IOption';
import * as iconv from "iconv-lite";
import chalk from "chalk";
import { FinancialOption } from './financialOption';
import { Sina300EtfOptionProvider } from './sina300EtfOptionProvider';
import { Sina300IndexOptionProvider } from './sina300IndexOptionProvider';
import moment from 'moment';

export class OptionCalculator {
    constructor() {
    }

    public async main() {
        const futuresPromise: { [contract: string]: Promise<string> } = {};
        const etfOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        const indexOptionsPromise: { [contract: string]: Promise<IOptionPair[]> } = {};
        let contract = '';

        contract = '2109';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        contract = '2107';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        contract = '2106';
        futuresPromise[contract] = this.getFutures(contract);
        etfOptionsPromise[contract] = this.getSina300EtfOptions(contract);
        indexOptionsPromise[contract] = this.getSina300IndexOptions(contract);

        console.log(chalk.green(`${contract}: etf`));
        await this.calculatePremium(futuresPromise[contract], etfOptionsPromise[contract]);
        console.log(chalk.green(`${contract}: index`));
        await this.calculatePremium(futuresPromise[contract], indexOptionsPromise[contract]);

        await this.watchMyPosition(etfOptionsPromise, indexOptionsPromise);

        await this.get50Etf();

        await this.analyzeIC500();
    }

    public calculatePremium(futuresPromise: Promise<string>, optionsPromise: Promise<IOptionPair[]>) {
        return Promise.all([futuresPromise, optionsPromise])
            .then(respone => {
                // console.log(chalk.green(`${contract}: ${source}`));

                // 1. Futures
                const futures: string = respone[0];
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
                        //console.log(call.buyPrice, put.sellPrice, call.executionPrice, call.underlyingPrice);
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
                        console.log(`${p.code}: Short at ${p.shortOption}, long at ${p.underlyingPrice}. Premium: ${p.shortPremium}. Close at: ${p.longPremium}`);
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

        const etf2109 = etfOptionsPromise['2109'];
        const etf2107 = etfOptionsPromise['2107'];
        const etf2106 = etfOptionsPromise['2106'];
        const index2106 = indexOptionsPromise['2106'];

        Promise.all([etf2109, etf2107, etf2106, index2106]).then(response => {
            const x = response[0].concat(response[1]).concat(response[2]).concat(response[3]);

            x.forEach(resp => {
                if (resp.code === 'io2106C5500') {
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue()}`);
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2106M5500') {
                    console.log(`${this.directionString('S')}: ${resp.code} time value: ${resp.call.timeValue()}`);
                }
            });

            console.log('----------------------------------------');
            let timeValue0 = 0;
            let timeValue1 = 0;
            x.forEach(resp => {
                if (resp.code === '510300C2106M5000') {
                    console.log(`${this.directionString('B')}: ${resp.code} time value: ${resp.call.timeValue()}`);
                    timeValue0 = resp.call.timeValue();
                }

                if (resp.code === '510300C2107M5000') {
                    console.log(`${this.directionString('S')}: ${resp.code} time value: ${resp.call.timeValue()}`);
                    timeValue1 = resp.call.timeValue();
                }
            });
            console.log(`Time value delta JULY - JUN: ${timeValue1 - timeValue0}. (It was 50 on JUN 11th)`);

            console.log('----------------------------------------');
            let total: number = 0;
            let near: number = 0;
            let far: number = 0;
            x.forEach(resp => {
                if (resp.code === '510300C2106M5500') {
                    console.log(chalk.green('SELL') + `${resp.code} time value: ${resp.call.timeValue()}. Price: ${resp.call.buyPrice}`);
                    console.log(chalk.green('BUY') + `${resp.code} time value: ${resp.put.timeValue()}. Price: ${resp.put.sellPrice}`);
                    near = - resp.put.sellPrice + resp.call.buyPrice + resp.call.executionPrice - resp.call.underlyingPrice;
                    total = - resp.put.sellPrice + resp.call.buyPrice + 250;
                }
            });

            x.forEach(resp => {
                if (resp.code === '510300C2109M5250') {
                    console.log(chalk.green('BUY') + `${resp.code} time value: ${resp.call.timeValue()}. Price: ${resp.call.sellPrice}`);
                    console.log(chalk.green('SELL') + `${resp.code} time value: ${resp.put.timeValue()}. Price: ${resp.put.buyPrice}`);
                    total = total - resp.call.sellPrice + resp.put.buyPrice;
                    far = - resp.call.sellPrice + resp.put.buyPrice - resp.call.executionPrice + resp.call.underlyingPrice;
                }
            });

            console.log(`total ${total}, near ${near}, far ${far}`);
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
                "upgrade-insecure-requests": "1"
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
        const provider = new Sina300EtfOptionProvider(contract);
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

    public async get50Etf() {

        const req = await fetch(`https://hq.sinajs.cn/list=s_sh510050`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        const rawCallBuffer = await req.buffer();
        const rawCall = iconv.decode(rawCallBuffer, 'GB18030');
        const regUnderlying = /(?<=hq_str_s_sh510050\=").*?(?=")/gmi;
        const underlying = rawCall.match(regUnderlying) || ['Regex failed'];;

        console.log(chalk.red(`${underlying}`));
    }

    private directionString (direction: 'B' | 'S') {
        if (direction === 'B') {
            return chalk.red('BUY');
        }

        if (direction === 'S') {
            return chalk.green('SELL');
        }
    }

    public async analyzeIC500() {
        const contract = 'sh000905,nf_IC2106,nf_IC2107,nf_IC2109,nf_IC2112';
        const months = ['2021-06', '2021-07', '2021-09', '2021-12'];

        const req = await fetch(`https://hq.sinajs.cn/?list=${contract}`, {
            "method": "GET",
        });

        const resp = iconv.decode(await req.buffer(), 'GB18030');
        const regIc = /(?<=var hq_str_nf_IC.*?\=").*?(?=")/gmi;
        const matchIc = resp.match(regIc) || ['Regex failed'];

        const thisMonthPrice = parseFloat(matchIc[0].split(',')[3]);
        const nextMonthPrice = parseFloat(matchIc[1].split(',')[3]);
        const nextQuarterPrice = parseFloat(matchIc[2].split(',')[3]);
        const otherQuarterPrice = parseFloat(matchIc[3].split(',')[3]);

        const regIndex = /(?<=hq_str_sh000905\=").*?(?=")/gmi;
        const matchIndex = resp.match(regIndex) || ['Regex failed'];;
        const index500 = parseFloat(matchIndex[0].split(',')[3]);

        const now = moment();
        const thisMonthDelivery =  moment(months[0]).day(14 + 5);
        const nextMonthDelivery = moment(months[1]).day(14 + 5);
        const nextQuarterDelivery = moment(months[2]).day(14 + 5);
        const otherQuarterDelivery = moment(months[3]).day(14 + 5);

        const daysThisMonth = moment.duration(thisMonthDelivery.diff(now)).asDays();
        const daysNextMonth = moment.duration(nextMonthDelivery.diff(now)).asDays();
        const daysNextQuarter = moment.duration(nextQuarterDelivery.diff(now)).asDays();
        const daysOtherQuarter = moment.duration(otherQuarterDelivery.diff(now)).asDays();
        
        console.log(`This M ${index500 - thisMonthPrice}, AVG: ${(index500 - thisMonthPrice) / daysThisMonth}`);
        console.log(`Next M ${index500 - nextMonthPrice}, AVG: ${(index500 - nextMonthPrice) / daysNextMonth}`);
        console.log(`Next Q ${index500 - nextQuarterPrice}, AVG: ${(index500 - nextQuarterPrice) / daysNextQuarter}`);
        console.log(`Other Q ${index500 - otherQuarterPrice}, AVG: ${(index500 - otherQuarterPrice) / daysOtherQuarter}`);
    }
}