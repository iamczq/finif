import fetch from 'node-fetch';
import { FinancialOption } from "./financialOption";
import { IDataProvider } from "./IDataProvider";
import { IOption, IOptionPair } from "./IOption";
import * as iconv from "iconv-lite";

export class Sina300IndexOptionProvider implements IDataProvider<Promise<IOptionPair[]>>{    
    private contract: string

    constructor(contract: string) {
        this.contract = contract;
    }

    async getData(): Promise<IOptionPair[]> {
        const contract = this.contract;
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

        const indexReq = await fetch(`https://hq.sinajs.cn/list=sh000300`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        // Options
        const resp = await req.json();
        const calls: any[][] = resp.result.data.up;
        const puts: any[][] = resp.result.data.down;

        // Underlying
        const indexRespBuffer = await indexReq.buffer();
        const rawIndex = iconv.decode(indexRespBuffer, 'GB18030');
        const regUnderlying = /(?<=hq_str_sh000300=").*?(?=")/gmi;
        const underlying = rawIndex.match(regUnderlying) || ['Regex failed'];

        const mappedCalls: IOption[] = calls.map(call => {
            if (call.length != 9) {
                console.log('Something must be changed!!!');
            }

            return new FinancialOption({
                'buyVol': parseFloat(call[0]),
                'buyPrice': parseFloat(call[1]),
                'price': parseFloat(call[2]),
                'sellPrice': parseFloat(call[3]),
                'sellVol': parseFloat(call[4]),
                'position': parseFloat(call[5]),
                'changePercent': parseFloat(call[6]),
                'executionPrice': parseFloat(call[7]),
                'code': call[8] as string,
                underlyingPrice: parseFloat(underlying[0].split(',')[3]),
            });
        });

        const mappedPuts: IOption[] = puts.map(put => {
            if (put.length != 8) {
                console.log('Something must be changed!!!');
            }

            return new FinancialOption({
                'buyVol': parseFloat(put[0]),
                'buyPrice': parseFloat(put[1]),
                'price': parseFloat(put[2]),
                'sellPrice': parseFloat(put[3]),
                'sellVol': parseFloat(put[4]),
                'position': parseFloat(put[5]),
                'changePercent': parseFloat(put[6]),
                'code': put[7] as string,
                executionPrice: NaN,
                underlyingPrice: parseFloat(underlying[0].split(',')[3]),
            });
        });

        const callPutPairs: IOptionPair[] = mappedCalls.map(call => {
            const callCode: string = call.code;
            const putCode = callCode.replace(/C/i, 'P');
            let put = mappedPuts.find(put => put.code.toLowerCase() === putCode.toLowerCase());

            if (!put) {
                console.log('Something must be wrong!!!');
                put = {} as IOption;
            }

            const pair: IOptionPair = {
                call: call,
                put: put,
                code: callCode,
            };

            // console.log(pair);
            return pair;
        }).filter(pair => pair.call !== undefined && pair.put !== undefined);

        return callPutPairs;
    }
}