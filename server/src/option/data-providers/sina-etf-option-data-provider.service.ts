import { Injectable } from '@nestjs/common';
import { OptionQuoteDto } from '../dto/option-quote.dto';
import fetch from 'node-fetch';
import * as iconv from 'iconv-lite';
import { SinaContractCode } from '../entities/contract.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as _ from 'lodash';
import { Calendar } from '../../util/calendar';

@Injectable()
export class SinaEtfOptionDataProviderService {
  protected readonly regUnderlying = /(?<=hq_str_s_sh510300=").*?(?=")/gim;
  protected readonly regCallName = /300etf购.+?月/i;
  protected readonly regPutName = /300etf沽.+?月/i;
  protected readonly regQuotes: RegExp = /(?<=").*?[购|沽].+?月.*?(?=")/gim;

  constructor(
    @InjectModel(SinaContractCode.name)
    private readonly sinaContractCodeModel: Model<SinaContractCode>,
  ) {}

  async getQuote(underlying: string, contractMonth: string): Promise<OptionQuoteDto[]> {
    const contracts = await this.getContracts(underlying, contractMonth);

    // contracts is like: CON_OP_10005251,CON_OP_10005241...
    const request = await fetch(`https://hq.sinajs.cn/list=${contracts},s_sh${underlying}`, {
      headers: {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'sec-fetch-dest': 'script',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
        referer: 'http://finance.sina.com.cn',
      },
      method: 'GET',
    });

    const rawBuffer = await request.buffer();
    const rawOptions = iconv.decode(rawBuffer, 'GB18030');

    const underlyingQuote = rawOptions.match(this.regUnderlying) || ['Regex failed'];
    const quotes = rawOptions.match(this.regQuotes) || ['Regex failed'];

    const mappedQuotes: OptionQuoteDto[] = quotes.map((quote) => {
      let type;
      if (this.regCallName.test(quote)) {
        quote = quote.replace(this.regCallName, `${underlying}C${contractMonth}M`);
        type = 'C';
      } else if (this.regPutName.test(quote)) {
        quote = quote.replace(this.regPutName, `${underlying}P${contractMonth}M`);
        type = 'P';
      }
      const arr = quote.split(',');
      const initializer: any = {
        buyVol: parseFloat(arr[0]),
        buyPrice: parseFloat(arr[1]),
        price: parseFloat(arr[2]),
        sellPrice: parseFloat(arr[3]),
        sellVol: parseFloat(arr[4]),
        position: parseFloat(arr[5]),
        changePercent: parseFloat(arr[6]),
        executionPrice: parseFloat(arr[7]),
        code: arr[37] as string,
        month: (arr[37] as string).substring(7, 11),
        type: type,
        underlyingPrice: parseFloat(underlyingQuote[0].split(',')[1]),
      };
      initializer.expireDays = this.getExpirationDays(underlying, initializer.month);

      return new OptionQuoteDto(initializer);
    });

    return mappedQuotes;
  }

  private async getContracts(underlying: string, contractMonth: string) {
    let allContractCode = await this.sinaContractCodeModel
      .findOne({
        underlying: underlying,
        contractMonth: contractMonth,
      })
      .exec();

    if (!allContractCode) {
      const codeRequest = await fetch(
        `https://hq.sinajs.cn/list=OP_UP_${underlying}${contractMonth},OP_DOWN_${underlying}${contractMonth}`,
        {
          headers: {
            accept: '*/*',
            'accept-language': 'zh-CN,zh;q=0.9',
            'sec-fetch-dest': 'script',
            'sec-fetch-mode': 'no-cors',
            'sec-fetch-site': 'cross-site',
            referer: 'http://finance.sina.com.cn',
          },
          method: 'GET',
        },
      );

      const code = await codeRequest.text();

      // Write to db.
      allContractCode = new this.sinaContractCodeModel({
        underlying: underlying,
        contractMonth: contractMonth,
        code: code,
      });
      allContractCode.save();
    }

    const regCodeCalls = /hq_str_OP_UP_.+?"(.+?)";/;
    const regCodePuts = /hq_str_OP_DOWN_.+?"(.+?)";/;

    const raw = allContractCode.code;
    const codeCalls = regCodeCalls.exec(raw);
    const codePuts = regCodePuts.exec(raw);

    if (!codeCalls || !codePuts) {
      throw new Error(`${raw} doesn't have valid call or put codes. Please check contract month.`);
    }

    return `${codeCalls[1]},${codePuts[1]}`;
  }

  private getExpirationDays = _.memoize(
    Calendar.getExpirationDays,
    (underlying: string, contractMonth: string) => `${underlying}${contractMonth}`,
  );
}
