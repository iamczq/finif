import fetch from 'node-fetch';
import { IOption, IOptionPair } from './IOption';

export class Options {
    constructor() {
    }

    /**
     * main
     */
    public main() {
        const contract = '2104';

        const futuresPromise = this.getFutures(contract);
        const optionsPromise = this.getSina300IndexOptions(contract);

        this.getEastMoney300EtfOptions(contract);

        Promise.all([futuresPromise, optionsPromise])
            .then(respone => {
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
                        // console.log(call.buyPrice, put.sellPrice, call.executionPrice);
                        longOption = - call.sellPrice + put.buyPrice - call.executionPrice;
                    }
                    return {
                        'code': call.code,
                        'shortOption': shortOption,
                        'longOption': longOption,
                        'shortPremium': Math.round((shortOption - futurePrice) * 100) / 100,
                        'longPremium': Math.round((futurePrice + longOption) * 100) / 100,
                    };
                }).filter(p => !Number.isNaN(p.shortOption));

                shortPremiumList
                    // Sort at liquidity
                    .sort((a, b) => (a.shortOption + a.longOption) - (b.shortOption + b.longOption))
                    .forEach(p => {
                        console.log(`${p.code}: Short at ${p.shortOption}, long at ${futurePrice}. Premium: ${p.shortPremium}. Close at: ${p.longPremium}`);
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
        const req = await fetch(`https://stock.finance.sina.com.cn/futures/api/openapi.php/OptionService.getOptionData?type=futures&product=io&exchange=cffex&pinzhong=io${contract}`, {
            "headers": {
                "accept": "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9",
                "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "STOCK7-FINANCE-SINA-COM-CN=; UOR=,stock.finance.sina.com.cn,; ULV=1617026222335:1:1:1::; sinaH5EtagStatus=n; SINAGLOBAL=165.225.116.142_1617026230.616170; Apache=165.225.116.142_1617026230.616172"
            },
            "method": "GET",
        });

        const resp = await req.json();

        const calls: any[][] = resp.result.data.up;
        const puts: any[][] = resp.result.data.down;

        const mappedCalls: IOption[] = calls.map(call => {
            if (call.length != 9) {
                console.log('Somthing must be changed!!!');
            }

            return {
                'buyVol': parseFloat(call[0]),
                'buyPrice': parseFloat(call[1]),
                'price': parseFloat(call[2]),
                'sellPrice': parseFloat(call[3]),
                'sellVol': parseFloat(call[4]),
                'position': parseFloat(call[5]),
                'changePercent': parseFloat(call[6]),
                'executionPrice': parseFloat(call[7]),
                'code': call[8] as string,
            };
        });

        const mappedPuts: IOption[] = puts.map(put => {
            if (put.length != 8) {
                console.log('Somthing must be changed!!!');
            }

            return {
                'buyVol': parseFloat(put[0]),
                'buyPrice': parseFloat(put[1]),
                'price': parseFloat(put[2]),
                'sellPrice': parseFloat(put[3]),
                'sellVol': parseFloat(put[4]),
                'position': parseFloat(put[5]),
                'changePercent': parseFloat(put[6]),
                'code': put[7] as string,
                executionPrice: NaN
            };
        });

        const callPutPairs: IOptionPair[] = mappedCalls.map(call => {
            const callCode: string = call.code;
            const putCode = callCode.replace(/C/i, 'P');
            let put = mappedPuts.find(put => put.code.toLowerCase() === putCode.toLowerCase());

            if (!put) {
                console.log('Somthing must be wrong!!!');
                put = {} as IOption;
            }

            const pair: IOptionPair = {
                call: call,
                put: put
            };

            // console.log(pair);
            return pair;
        }).filter(pair => pair.call !== undefined && pair.put !== undefined);

        return callPutPairs;
    }

    private async getSina300EtfOptions(contract: string)/*: Promise<IOptionPair[]>*/ {
        const codeRequest = await fetch(`https://hq.sinajs.cn/list=OP_UP_510300${contract},OP_DOWN_510300${contract},s_sh510050`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        const raw = await codeRequest.text();

        console.log(raw);

        const regCalls: RegExp = /hq_str_OP_UP_.+?"(.+?)";/;
        const regPuts: RegExp = /hq_str_OP_DOWN_.+?"(.+?)";/;

        const codeCalls = regCalls.exec(raw) || ['Regex failed', 'Regex failed'];
        const codePuts = regPuts.exec(raw) || ['Regex failed', 'Regex failed'];


        const reqCall = await fetch("https://hq.sinajs.cn/list=CON_OP_10003315,CON_OP_10003303,CON_OP_10003299,CON_OP_10003263,CON_OP_10003264,CON_OP_10003265,CON_OP_10003266,CON_OP_10003267,CON_OP_10003268,CON_OP_10003269,CON_OP_10003270,CON_OP_10003271,s_sh510050", {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        const rawCall = await reqCall.text();

        console.log(rawCall);

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
}