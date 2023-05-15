import { TestBed } from '@angular/core/testing';

import { OptionQuotesService } from './option-quotes.service';

describe('OptionQuotesService', () => {
  let service: OptionQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptionQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
