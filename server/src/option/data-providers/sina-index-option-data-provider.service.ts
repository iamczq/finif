import { Injectable } from '@nestjs/common';
import { OptionQuoteDto } from '../dto/option-quote.dto';
import fetch from 'node-fetch';
import * as iconv from 'iconv-lite';

@Injectable()
export class SinaIndexOptionDataProviderService {
  async getQuote(
    underlying: string,
    contractMonth: string,
  ): Promise<OptionQuoteDto[]> {
    const contract = `${underlying}${contractMonth}`;
    const req = await fetch(
      `https://stock.finance.sina.com.cn/futures/api/openapi.php/OptionService.getOptionData?type=futures&product=${underlying}&exchange=cffex&pinzhong=${contract}`,
      {
        headers: {
          accept:
            'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
          'accept-language': 'en-US,en;q=0.9',
          'sec-ch-ua':
            '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-requested-with': 'XMLHttpRequest',
          cookie:
            'STOCK7-FINANCE-SINA-COM-CN=; UOR=,stock.finance.sina.com.cn,; ULV=1617026222335:1:1:1::; sinaH5EtagStatus=n; SINAGLOBAL=165.225.116.142_1617026230.616170; Apache=165.225.116.142_1617026230.616172',
          referer: 'http://finance.sina.com.cn',
        },
        method: 'GET',
      },
    );

    let index;
    if (underlying === 'io') {
      index = 'sh000300';
    } else if (underlying === 'ho') {
      index = 'sh000016';
    } else if (underlying === 'mo') {
      index = 'sh000852';
    } else {
      throw new Error(`Underlying ${underlying} is not supported.`);
    }
    const indexReq = await fetch(`https://hq.sinajs.cn/list=${index}`, {
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

    // Options
    const resp = await req.json();
    const calls: any[][] = resp.result.data.up;
    const puts: any[][] = resp.result.data.down;

    // Underlying
    const indexRespBuffer = await indexReq.buffer();
    const rawIndex = iconv.decode(indexRespBuffer, 'GB18030');
    const regIndex = new RegExp(`(?<=hq_str_${index}=").*?(?=")`, 'gim');
    const quoteUnderlying = rawIndex.match(regIndex) || ['Regex failed'];
    const underlyingPrice = parseFloat(quoteUnderlying[0].split(',')[3]);

    const mappedQuotes: OptionQuoteDto[] = calls.map((call) => {
      if (call.length != 9) {
        console.warn('Something must be changed!!!');
      }

      return new OptionQuoteDto({
        buyVol: parseFloat(call[0]),
        buyPrice: parseFloat(call[1]),
        price: parseFloat(call[2]),
        sellPrice: parseFloat(call[3]),
        sellVol: parseFloat(call[4]),
        position: parseFloat(call[5]),
        changePercent: parseFloat(call[6]),
        executionPrice: parseFloat(call[7]),
        code: call[8] as string,
        month: (call[8] as string).substring(2, 6),
        type: 'C',
        underlyingPrice: underlyingPrice,
      });
    });

    const mappedPuts: OptionQuoteDto[] = puts.map((put) => {
      if (put.length != 8) {
        console.warn('Something must be changed!!!');
      }

      return new OptionQuoteDto({
        buyVol: parseFloat(put[0]),
        buyPrice: parseFloat(put[1]),
        price: parseFloat(put[2]),
        sellPrice: parseFloat(put[3]),
        sellVol: parseFloat(put[4]),
        position: parseFloat(put[5]),
        changePercent: parseFloat(put[6]),
        executionPrice: parseFloat((put[7] as string).substring(7)),
        code: put[7] as string,
        month: (put[7] as string).substring(2, 6),
        type: 'P',
        underlyingPrice: underlyingPrice,
      });
    });

    return mappedQuotes.concat(mappedPuts);
  }
}
