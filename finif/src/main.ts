import fetch from 'node-fetch';

console.log('Start');

const contract = '2104';

const futuresPromise = fetch(`https://hq.sinajs.cn/?list=nf_IF${contract}`, {
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

const optionsPromise = fetch(`https://stock.finance.sina.com.cn/futures/api/openapi.php/OptionService.getOptionData?type=futures&product=io&exchange=cffex&pinzhong=io${contract}`, {
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

Promise.all([futuresPromise, optionsPromise])
    .then(respone => Promise.all([ respone[0].text(), respone[1].json()]))
    .then(respone => {
        // 1. Futures
        const futures: string = respone[0];
        const hqString: string = eval(futures.substring(futures.indexOf('=') + 1));
        const hqArray = hqString.split(',');
        const futurePrice = parseFloat(hqArray[3]);

        // 2. Options
        const options = respone[1];
        const calls: any[][] = options.result.data.up;
        const puts: any[][] = options.result.data.down;

        const mappedCalls = calls.map(call => {
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
                'code': call[8] as string
            };
        });

        const mappedPuts = puts.map(put => {
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
                'code': put[7] as string
            };
        });

        const callPutPairs = mappedCalls.map(call => {
            const callCode: string = call.code;
            const putCode = callCode.replace(/C/i, 'P');
            const put = mappedPuts.find(put => put.code.toLowerCase() === putCode.toLowerCase());

            if (!put) {
                console.log('Somthing must be wrong!!!');
            }

            const pair = {
                call: call,
                put: put
            };

            // console.log(pair);
            return pair;
        }).filter(pair => pair.call !== undefined && pair.put !== undefined);

        const shortPremiumList = callPutPairs.map(pair => {
            const call = pair.call;
            const put = pair.put;

            let shortPremium;
            if (call === undefined || put === undefined) {
                shortPremium = NaN;
            } else if (call.buyPrice == 0 || put.sellPrice == 0) {
                shortPremium = NaN;
            } else {
                shortPremium = call.buyPrice - put.sellPrice + call.executionPrice;
                console.log(call.buyPrice, put.sellPrice, call.executionPrice);
            }
            return {
                'code': call.code,
                'shortPremium': shortPremium,
            };
        }).filter(p => !Number.isNaN(p.shortPremium));

        shortPremiumList
            .sort((a, b) => a.shortPremium - b.shortPremium)
            .forEach(p => {
                console.log(`${p.code}: Short at ${p.shortPremium}, long at ${futurePrice}. Premium: ${Math.round((p.shortPremium - futurePrice) * 100) / 100}`);
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
                console.log(`${p.code}: Long at ${p.longPremium}, short at ${futurePrice}. Premium: ${Math.round((futurePrice + p.longPremium) * 100) / 100}`);
            });
    });
