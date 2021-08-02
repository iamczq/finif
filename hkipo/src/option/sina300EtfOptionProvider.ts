import fetch from 'node-fetch';
import { FinancialOption } from "./financialOption";
import { IOption, IOptionPair } from "./IOption";
import * as iconv from "iconv-lite";
import { IDataProvider } from './IDataProvider';
import fs from 'fs';
import moment from 'moment';

export class SinaEtfOptionProvider implements IDataProvider<Promise<IOptionPair[]>> {

    protected readonly contract: string;
    protected readonly etf: string;
    protected readonly regUnderlying: RegExp;
    protected readonly regCalls: RegExp = /(?<=").*?购.+?月.*?(?=")/gmi;
    protected readonly regPuts: RegExp = /(?<=").*?沽.+?月.*?(?=")/gmi;
    protected readonly regCallName: RegExp;
    protected readonly regPutName: RegExp;

    constructor(code: string, contract: string) {
        this.etf = code;
        this.contract = contract;
        if (code === '510300') {
            this.regUnderlying = /(?<=hq_str_s_sh510300=").*?(?=")/gmi;
            this.regCallName = /300etf购.+?月/i;
            this.regPutName = /300etf沽.+?月/i;
        } else if (code === '510050') {
            this.regUnderlying = /(?<=hq_str_s_sh510050=").*?(?=")/gmi;
            this.regCallName = /50etf购.+?月/i;
            this.regPutName = /50etf沽.+?月/i;
        } else {
            throw new Error(`${code} is not a valid etf code.`);
        }
    }

    public async getData(): Promise<IOptionPair[]> {
        const etf = this.etf;
        const contract = this.contract;
        const path = `data/option/${etf}-${contract}.json`;
        let raw = '';

        if (fs.existsSync(path)) {
            const content = fs.readFileSync(path);
            const data = JSON.parse(content.toString());
            if (data.dayOfYear === moment().dayOfYear()) {
                raw = data.text;
            }
        }

        if (raw === '') {
            const codeRequest = await fetch(`https://hq.sinajs.cn/list=OP_UP_${etf}${contract},OP_DOWN_${etf}${contract}`, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "sec-fetch-dest": "script",
                    "sec-fetch-mode": "no-cors",
                    "sec-fetch-site": "cross-site"
                },
                "method": "GET",
            });

            raw = await codeRequest.text();

            const writerStream = fs.createWriteStream(path);
            writerStream.write(JSON.stringify({
                'dayOfYear': moment().dayOfYear(),
                'text': raw
            }));
        }

        const regCodeCalls = /hq_str_OP_UP_.+?"(.+?)";/;
        const regCodePuts = /hq_str_OP_DOWN_.+?"(.+?)";/;

        const codeCalls = regCodeCalls.exec(raw) || ['Regex failed', 'Regex failed'];
        const codePuts = regCodePuts.exec(raw) || ['Regex failed', 'Regex failed'];

        const request = await fetch(`https://hq.sinajs.cn/list=${codeCalls[1]},${codePuts[1]},s_sh${etf}`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "sec-fetch-dest": "script",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site"
            },
            "method": "GET",
        });

        const rawBuffer = await request.buffer();
        const rawOptions = iconv.decode(rawBuffer, 'GB18030');

        const underlying = rawOptions.match(this.regUnderlying) || ['Regex failed'];
        const calls = rawOptions.match(this.regCalls) || ['Regex failed'];
        const puts = rawOptions.match(this.regPuts) || ['Regex failed'];

        const mappedCalls: IOption[] = calls.map(call => {
            call = call.replace(this.regCallName, `${etf}C${contract}M`);
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
                underlyingPrice: parseFloat(underlying[0].split(',')[1]) * 1000,
            });
        });

        const mappedPuts: IOption[] = puts.map(put => {
            put = put.replace(this.regPutName, `${etf}P${contract}M`);
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
                underlyingPrice: parseFloat(underlying[0].split(',')[1]) * 1000,
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
                code: callCode, // todo: What code to use?
            };

            // console.log(pair);
            return pair;
        }).filter(pair => pair.call !== undefined && pair.put !== undefined);
        
        return callPutPairs;
    }
}