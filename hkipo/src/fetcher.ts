import fs from 'fs';
import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import { setInterval } from 'timers';
import { Parser } from 'json2csv';

export class Fetcher {
    constructor() {
    }

    /**
     * fetchAIpo
     */
    public fetchAIpoToConsole() {
        console.log('Fetching AIpo.org');
        const request = this.getIpoListRequest();

        request
            .then(res => res.json())
            .then(json => {
                console.log(json)
            });
    }

    public fetchAIpoToFile() {
        console.log('Fetching AIpo.org');

        for (let i = 10; i <= 10; i++) {
            const request = this.getIpoListRequest(i, 100);

            request.then((val) => {
                const writerStream = fs.createWriteStream(`output-${i}.json`);
                val.body.pipe(writerStream);
                val.body.setEncoding('utf-8');
                val.body
                    .on('data', function (chunk) {
                        console.log(chunk);
                    })
                    .on('end', function () {
                        console.log('Fetched AIpo.org successfully.');
                    });
            });
        }
    }

    public fetchIpoDetail() {
        console.log('Fetching Ipo Detail.');

        const content = fs.readFileSync(`output-All.json`);
        const dataList: [] = JSON.parse(content.toString());
        const requests = dataList
            .filter((data: any) => {
                const code = data.symbol;
                const oldPath = `data/ipo_detail/E${code}.json`;
                const newPath = `data/ipo_detail/${code}.json`;

                if (!data.symbol) {
                    console.log(`Symbol is not defined.`);
                    return false;
                }

                if (fs.existsSync(oldPath)) {
                    const stats = fs.statSync(oldPath);
                    console.log(`Found old name ${oldPath}, Modified at ${stats.mtime}.`);
                    fs.renameSync(oldPath, newPath);
                    return false;
                }

                if (fs.existsSync(newPath)) {
                    const stats = fs.statSync(newPath);
                    console.log(`Found new name ${newPath}, Modified at ${stats.mtime}.`);
                    return false;
                }

                return true;
            })
            .map((data: any) => {
                return this.getStockBriefRequest(data.symbol);
            });

        const reqIterator = this.arrayToGenerator(requests);

        const interval = setInterval(() => {
            const next = reqIterator.next();

            if (typeof next.value !== 'undefined') {
                const code = next.value.code;
                const request: () => Promise<Response> = next.value.request;
                const path = `data/ipo_detail/${code}.json`;

                if (typeof request !== 'undefined') {
                    console.log(`Sending request for ${code}`);
                    request()
                        .then(res => {
                            if (res.ok) {
                                return res.json();
                            } else {
                                console.log('Not ok.')
                                throw res;
                            }
                        })
                        .then(json => {
                            const obj = JSON.parse(json.msg);
                            const writerStream = fs.createWriteStream(path);
                            writerStream.write(JSON.stringify(obj));
                        })
                        .catch((res: Response) => {
                            res.body.setEncoding('utf-8');
                            res.body
                                .on('data', function (chunk) {
                                    console.log(chunk);
                                })
                                .on('end', function () {
                                    console.log('Error printed.');
                                });
                            clearInterval(interval);
                        });
                }
            }

            if (next.done === true) {
                clearInterval(interval);
            }

        }, 1300);
    }

    private async getIpoListRequest(page = 1, size = 20) {
        const request = await fetch(`https://www.aipo.org/Home/GetHistoryIPOList?sector=&code=&pageIndex=${page}&pageSize=${size}&orderField=ListedDate&orderBy=DESC`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "zh-TW,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6",
                "requestverificationtoken": "CfDJ8K97ruGCmBBFh_4JKjbHE1xtn68P-Oy_f7LuAtGM2YpNj3iJw-I0oNJrN0IXO9HkWgSUAkDv8auqRE_hRfg5oL_JXVZtKqPGjCi-2j15bE5ktywB8kg1adEDPQjwP7PpTC0n7QmXrK1MNzGDHgK-_3VfwkdvkZFoWEOMXNsS-chqon1CbgFNxrz586GSh-EWYw",
                "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "zh_choose=t; traderDataSite=CfDJ8K97ruGCmBBFh_4JKjbHE1wzRVKx4bRmIjW7bBeZZ1bnDCiC3s2uKUiy6t6SD4SxREFvpWX4oNo7tEZ_kyatzQuNbukO-rqCCO6g7-3XhWt8cELGdmcLqb_fmjJMm42Cz91ksw4kf_W_KYwRh3YXccE; Hm_lvt_3a27674636bd41905f818ad38a581b99=1613831794; UM_distinctid=177bfdeee1a63a-080dc487d1baf2-1c184759-13c680-177bfdeee1ba53; CNZZDATA1278551646=968521528-1613830060-%7C1613830060; firstaipo=yes; .AspNetCore.traderDataLogin=CfDJ8K97ruGCmBBFh_4JKjbHE1y5L9na3tsgqPTLGgwMD95W7hAz31U6RXFnjJzJyJbJchiHHK1jyX_VR8wD73kcTuPTJBsSe6AzxekIRru9bA5H7x2Qc-kha_I4gmxBuRspCjWWmXZWNJj0-4SlcyWSW0C01_kluYkbAqLSnFOx7eLwsqmYf7H2JDnKmiTmCQkNEXC7RL5Dl4LOnHUohRf6OKj_7RXl2YWWCRDBrbWnzkC97qxhcU143nNY43p6nwdWofZnLPOmQc2aIZRasBiWaX4Dqze_iqQRkjAr1sIxygGuCrzyo2D0npA-xOFQIW3MF7oBilj3ybx4uOGzzY52D2m3E9SfBqze9uFdEF0oK4TBFVorJefX9qnKCokZdvEKKcvV2ARk3DssyFlcmOsItT-MJdH_Zr6E8dt1poONkhFEUw_6pRfTzDAgMt2EUwHPZEABTVY3IWx-eaPM-qceg9sK8o6AfkIvy9pmTLtbIQF6OLFBVwosnzWHnu-BOjCNu6jnC1aDx3-P1TSYf3dRr0uJVU-1IWGICBdlkpe5F9V4; Hm_lpvt_3a27674636bd41905f818ad38a581b99=1613833012"
            },
            "method": "GET",
        });

        return request;
    }

    private getStockBriefRequest(code: string) {
        const obj = {
            code: code,
            request: async () => {
                return await fetch(`https://www.aipo.org/Home/NewStockBrief?v=0.5269451703779495&code=E${code}`, {
                    "headers": {
                        "accept": "application/json, text/javascript, */*; q=0.01",
                        "accept-language": "zh-TW,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6",
                        "requestverificationtoken": "CfDJ8K97ruGCmBBFh_4JKjbHE1wQYdO6jMuraSjSrTCW40gHnc06V-K7sF80bPPLKjW6fjYNqE2stUIu5YOYqVPxj_Lu7KJRAvr89hh52EO--Z7qBb3-JMTRdVEENP_B5o0Aqz5osyLVYQcF_CM8Ls-RYaq-BheDCVHyNeVEWb3dFZlP_iY8r1bvCXkeR8oCkISHZA",
                        "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-requested-with": "XMLHttpRequest",
                        "cookie": "traderDataSite=CfDJ8K97ruGCmBBFh_4JKjbHE1wzRVKx4bRmIjW7bBeZZ1bnDCiC3s2uKUiy6t6SD4SxREFvpWX4oNo7tEZ_kyatzQuNbukO-rqCCO6g7-3XhWt8cELGdmcLqb_fmjJMm42Cz91ksw4kf_W_KYwRh3YXccE; Hm_lvt_3a27674636bd41905f818ad38a581b99=1613831794; UM_distinctid=177bfdeee1a63a-080dc487d1baf2-1c184759-13c680-177bfdeee1ba53; .AspNetCore.traderDataLogin=CfDJ8K97ruGCmBBFh_4JKjbHE1y5L9na3tsgqPTLGgwMD95W7hAz31U6RXFnjJzJyJbJchiHHK1jyX_VR8wD73kcTuPTJBsSe6AzxekIRru9bA5H7x2Qc-kha_I4gmxBuRspCjWWmXZWNJj0-4SlcyWSW0C01_kluYkbAqLSnFOx7eLwsqmYf7H2JDnKmiTmCQkNEXC7RL5Dl4LOnHUohRf6OKj_7RXl2YWWCRDBrbWnzkC97qxhcU143nNY43p6nwdWofZnLPOmQc2aIZRasBiWaX4Dqze_iqQRkjAr1sIxygGuCrzyo2D0npA-xOFQIW3MF7oBilj3ybx4uOGzzY52D2m3E9SfBqze9uFdEF0oK4TBFVorJefX9qnKCokZdvEKKcvV2ARk3DssyFlcmOsItT-MJdH_Zr6E8dt1poONkhFEUw_6pRfTzDAgMt2EUwHPZEABTVY3IWx-eaPM-qceg9sK8o6AfkIvy9pmTLtbIQF6OLFBVwosnzWHnu-BOjCNu6jnC1aDx3-P1TSYf3dRr0uJVU-1IWGICBdlkpe5F9V4; zh_choose=t; firstaipo=yes; Hm_lpvt_3a27674636bd41905f818ad38a581b99=1614439919; CNZZDATA1278551646=968521528-1613830060-%7C1614434667"
                    },
                    "method": "GET",
                })
            },
        }

        return obj;
    }

    /**
     * combineOutput
     */
    public combineOutput() {
        const writerStream = fs.createWriteStream(`output-All.json`);
        let ipo: any[] = [];

        for (let i = 5; i <= 14; i++) {
            const content = fs.readFileSync(`data/output-${i}.json`);
            let obj = JSON.parse(content.toString());
            const dataList = obj.data.dataList;

            ipo = ipo.concat(dataList);
        }

        console.log(ipo.length);
        writerStream.write(JSON.stringify(ipo));
    }

    /**
     * play
     */
    public play() {
        const allStocks = fs.readFileSync(`output-All.json`);
        const stockList: [] = JSON.parse(allStocks.toString());
        const allProfit: any[] = [];
        const finalObj: any[] = [];
        let invalidCount = 0, processedCount = 0;

        stockList.forEach((data: any) => {
            processedCount++;
            const code = data.symbol;
            const path = `data/ipo_detail/${code}.json`;
            if (fs.existsSync(path)) {
                const stockFile = fs.readFileSync(path);
                const stockObj = JSON.parse(stockFile.toString());

                if (Number.isNaN(Number.parseFloat(stockObj.data.issuanceinfo.codesrate))) {
                    invalidCount++;
                    return;
                }

                if (data.ipoPricing && data.firstPrice) {
                    let p = (data.firstPrice - data.ipoPricing)
                        * stockObj.data.issuanceinfo.shares
                        * Number.parseFloat(stockObj.data.issuanceinfo.codesrate) / 100;
                    allProfit.push(p);
                }

                finalObj.push({
                    '代码': code,
                    '名称': stockObj.data.issuanceinfo.name,
                    '行业': stockObj.data.issuanceinfo.industry,
                    '板块': data.sector,
                    '每手股数': stockObj.data.issuanceinfo.shares,
                    '认购倍数': stockObj.data.issuanceinfo.subscribed,
                    '发行市值': stockObj.data.issuanceinfo.marketcap,
                    '上市价': data.ipoPricing,
                    '首日收盘价': data.firstPrice,
                    '中签率': stockObj.data.issuanceinfo.codesrate,
                });
            }
        });
        console.log(`${processedCount} processed, ${invalidCount} items invalid.`);

        const parser = new Parser();
        const csv = parser.parse(finalObj);
        const writerStream = fs.createWriteStream(`all.csv`);
        writerStream.write(csv);

        let pp = 0;
        allProfit.forEach(x => {
            pp = pp + x;
        });

        console.log(pp);
    }

    private * arrayToGenerator(array: any[]) {
        array = array || [];

        for (let i = 0; i < array.length - 1; i++) {
            yield array[i];
        }

        return array[array.length - 1];
    }
}
