import { Component, OnInit } from '@angular/core';
import { filter, map } from 'rxjs';
import { OptionYieldDto } from 'src/app/dtos/option-yield.dto';
import { OptionQuotesService } from 'src/app/services/option-quotes.service';

@Component({
  selector: 'app-option-yields',
  templateUrl: './option-yields.component.html',
  styleUrls: ['./option-yields.component.scss'],
})
export class OptionYieldsComponent implements OnInit {
  underlying = 'io';
  farMonth = '2403';
  nearMonth = '2312';
  valuation = '2000';
  yields: OptionYieldDto[] = [];
  isRefreshing = false;

  constructor(private optionQuoteService: OptionQuotesService) {}

  ngOnInit(): void {}

  refresh(): void {
    this.isRefreshing = true;
    this.optionQuoteService
      .getYields(this.underlying, this.farMonth, this.nearMonth, this.valuation)
      .pipe(map((ret) => ret.filter((obj) => obj != null)))
      .subscribe((value) => {
        this.yields = value;
        this.isRefreshing = false;
      });
  }

  /**
   * Returns a list of contracts in next 12 months. The format of each item in the list is yymm.
   * For example, if this month is 2023-07, return [2307, 2308, 2309, ..., 2406]
   */
  get contracts(): string[] {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const result: string[] = [];
    for (let i = 0; i < 12; i++) {
      const month = currentMonth + i;
      const year = month > 12 ? currentYear + 1 : currentYear;
      const monthString =
        month > 12 ? (month % 12).toString() : month.toString();
      result.push(`${year - 2000}${monthString.padStart(2, '0')}`);
    }
    return result;
  }
}
