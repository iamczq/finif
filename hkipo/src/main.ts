import chalk from "chalk";
// todo: What's the {} here?
import { prompt } from 'enquirer';
import { Fetcher } from "./fetcher";
import { Options } from "./option/option";

console.log('START!!!!!!!!!!!!!!');
prompt({
  type: 'input',
  name: 'select',
  message: chalk.yellowBright(`Choose options:\r\n`)
    + chalk.yellow(`1. jsl`) + '\r\n'
    + chalk.yellow(`2. Fetch IPO list`) + '\r\n'
    + chalk.yellow(`3. Fetch IPO detail`) + '\r\n'
    + chalk.yellow(`4. Combine output.`) + '\r\n'
    + chalk.yellow(`5. Play!`) + '\r\n'
    + chalk.yellow(`6. Option!`),
}).then((response: any) => {
  const fetcher = new Fetcher();
  switch (response.select) {
    case '2':
      // fetcher.fetchAIpoToFile();
      break;
    case '3':
      fetcher.fetchIpoDetail();
      break;
    case '4':
      fetcher.combineOutput();
      break;
    case '5':
      fetcher.play();
      break;
    case '6':
      const options = new Options();
      options.main();
      break;
    default:
      console.log('Invalid choice.');
      break;
  }
});


// // load fs
// import fs from "fs";
// // read the file
// const content = fs.readFileSync("./src/hkipo.json");
// // print it
// let obj = JSON.parse(content.toString());
// let ipos: [] = obj.rows;

// let expected_array = ipos.map((value: any, index: number, array: any[]) => {
//     let ipo = value.cell;
//     // console.log(ipo);

//     let lucky_draw_rt = parseFloat(ipo.lucky_draw_rt) / 100;
//     let first_incr_rt = parseFloat(ipo.first_incr_rt) / 100;
//     let single_draw_money = parseFloat(ipo.single_draw_money);
//     lucky_draw_rt = isNaN(lucky_draw_rt) ? 0 : lucky_draw_rt;
//     first_incr_rt = isNaN(first_incr_rt) ? 0 : first_incr_rt;
//     single_draw_money = isNaN(single_draw_money) ? 0 : single_draw_money;

//     let cost = single_draw_money * 0.03;

//     let expected_return = single_draw_money * first_incr_rt * lucky_draw_rt - cost;

//     expected_return = Math.round(expected_return * 100) / 100;

//     ipo.expected_return = expected_return;

//     return {
//         stock_nm: ipo.stock_nm,
//         above_rt: ipo.above_rt,
//         expected_return: ipo.expected_return
//     };
// });

// let negative = expected_array.filter((value: any) => value.expected_return <= 0);
// console.log(negative);

// let positive = expected_array.filter((value: any) => value.expected_return > 0);
// console.log(positive);

// let expected = expected_array.reduce((previousValue: any, current: any) => {
//     return previousValue.expected_return + current.expected_return;
// }, 0);

// console.log(`Expected: ${expected}`);

// ///////////////////////////////////////////////////////////////////////////////////
