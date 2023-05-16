import { Component, OnInit } from '@angular/core';
import { filter, map } from 'rxjs';
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
  yields: any = [];
  isRefreshing = false;

  constructor(private optionQuoteService: OptionQuotesService) {}

  ngOnInit(): void {}

  refresh(): void {
    this.isRefreshing = true;
    this.optionQuoteService
      .getYields(this.underlying, this.farMonth, this.nearMonth, this.valuation)
      .pipe(map((ret) => (ret as Array<any>).filter((obj) => obj != null)))
      .subscribe((value) => {
        this.yields = value as any;
        this.isRefreshing = false;
      });
  }
}
