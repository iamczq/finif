import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class OptionQuotesService {

  private baseUrl = `https://finif.us.to:8080/api/options`;

  constructor(private http: HttpClient) { }

  getQuotes (underlying: string, month: string) {
    const url = `${this.baseUrl}/${underlying}/${month}`;
    return this.http.get(url);
  }

  getYields (underlying: string, farMonth: string, nearMonth?: string, valuation?: string) {
    const url = `${this.baseUrl}/yield?underlying=${underlying}&contract=${farMonth}&nearContract=${nearMonth}&valuation=${valuation}`;
    return this.http.get(url);
  }
}
