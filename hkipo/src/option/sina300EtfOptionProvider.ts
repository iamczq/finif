import fetch from 'node-fetch';
import { FinancialOption } from "./financialOption";
import { IOption, IOptionPair } from "./IOption";
import * as iconv from "iconv-lite";
import { IDataProvider } from './IDataProvider';

export class Sina300EtfOptionProvider implements IDataProvider<Promise<IOptionPair[]>> {

    private contract: string

    constructor(contract: string) {
        this.contract = contract;
    }

    public async getData(): Promise<IOptionPair[]> {
        const etf = '510300';
        const contract = this.contract;

        const codeRequest = await fetch(`https://hq.sinajs.cn/list=OP_UP_${etf}${contract},OP_DOWN_${etf}${contract},s_sh510050`, {
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

        const regCodeCalls: RegExp = /hq_str_OP_UP_.+?"(.+?)";/;
        const regCodePuts: RegExp = /hq_str_OP_DOWN_.+?"(.+?)";/;

        const codeCalls = regCodeCalls.exec(raw) || ['Regex failed', 'Regex failed'];
        const codePuts = regCodePuts.exec(raw) || ['Regex failed', 'Regex failed'];

        const reqCall = await fetch(`https://hq.sinajs.cn/list=${codeCalls[1]},s_sh${etf}`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });
        const reqPut = await fetch(`https://hq.sinajs.cn/list=${codePuts[1]},s_sh${etf}`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        const response = await Promise.all([reqCall, reqPut]);

        const rawCallBuffer = await response[0].buffer();
        const rawCall = iconv.decode(rawCallBuffer, 'GB18030');
        const regCalls: RegExp = /(?<=").*?购.+?月.*?(?=")/gmi;
        const calls = rawCall.match(regCalls) || ['Regex failed'];

        const regUnderlying = /(?<=hq_str_s_sh510300\=").*?(?=")/gmi;
        const underlying = rawCall.match(regUnderlying) || ['Regex failed'];;

        const mappedCalls: IOption[] = calls.map(call => {
            call = call.replace(/300etf购.+?月/i, `${etf}C${contract}M`);
            const arr = call.split(',');
            return new FinancialOption({
                'buyVol': parseFloat(arr[0]),
                'buyPrice': parseFloat(arr[1]) * 1000,
                'price': parseFloat(arr[2]) * 1000,
                'sellPrice': parseFloat(arr[3]) * 1000,
                'sellVol': parseFloat(arr[4]),
                'position': parseFloat(arr[5]),
                'changePercent': parseFloat(arr[6]),
                'executionPrice': parseFloat(arr[7]) * 1000,
                'code': arr[37] as string,
                underlyingPrice: parseFloat(underlying[1]) * 1000,
            });
        });

        const rawPutBuffer = await response[1].buffer();
        const rawPut = iconv.decode(rawPutBuffer, 'GB18030');
        const regPuts: RegExp = /(?<=").*?沽.+?月.*?(?=")/gmi;
        const puts = rawPut.match(regPuts) || ['Regex failed'];

        const mappedPuts: IOption[] = puts.map(put => {
            put = put.replace(/300etf沽.+?月/i, `${etf}P${contract}M`);
            const arr = put.split(',');
            return new FinancialOption({
                'buyVol': parseFloat(arr[0]),
                'buyPrice': parseFloat(arr[1]) * 1000,
                'price': parseFloat(arr[2]) * 1000,
                'sellPrice': parseFloat(arr[3]) * 1000,
                'sellVol': parseFloat(arr[4]),
                'position': parseFloat(arr[5]),
                'changePercent': parseFloat(arr[6]),
                'executionPrice': parseFloat(arr[7]) * 1000,
                'code': arr[37] as string,
                underlyingPrice: parseFloat(underlying[1]) * 1000,
            });
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
}