import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OptionYieldDto } from '../dtos/option-yield.dto';

@Injectable({
  providedIn: 'root',
})
export class OptionQuotesService {
  private baseUrl = `https://finif.us.to:8080/api/options`;

  constructor(private http: HttpClient) {}

  getQuotes(underlying: string, month: string) {
    const url = `${this.baseUrl}/${underlying}/${month}`;
    return this.http.get(url);
  }

  getYields(
    underlying: string,
    farMonth: string,
    nearMonth?: string,
    valuation?: string
  ): Observable<OptionYieldDto[]> {
    const url =
      `${this.baseUrl}/yield` +
      `?underlying=${underlying}&contract=${farMonth}` +
      `&nearContract=${nearMonth}&valuation=${valuation}`;
    return this.http.get(url) as Observable<OptionYieldDto[]>;
  }
}
