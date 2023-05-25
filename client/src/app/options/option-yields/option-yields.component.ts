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
}
