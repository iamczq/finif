import moment from 'moment';

export class Calendar {
  public static getExpireDate(
    shortMonth: string,
    numberOf: number,
    weekday: number,
  ): moment.Moment {
    if (numberOf % 1 > 0 || weekday % 1 > 0) {
      throw new Error('numberOf weekday should be integer.');
    }
    if (numberOf > 5 || numberOf < 1) {
      throw new Error('numberOf should be 1 to 5.');
    }
    if (weekday > 6 || weekday < 0) {
      throw new Error('weekday should be 0 to 6.');
    }

    const month = '20' + shortMonth.substring(0, 2) + '-' + shortMonth.substring(2, 4);
    let days;
    // If the first day of this month > Wednesday.
    // moment(month)                  > moment(month).day(3)
    if (moment(month).day(weekday) < moment(month)) {
      days = 7 * numberOf + weekday;
    } else {
      days = 7 * (numberOf - 1) + weekday;
    }

    return moment(month).day(days);
  }

  public static thirdFriday(year: number, month: number): Date {
    const date = new Date(year, month - 1, 1); // set date to first day of the month
    let count = 0;

    while (count < 3 && date.getMonth() === month - 1) {
      if (date.getDay() === 5) {
        // Friday has index 5 in getDay()
        count++;
      }
      if (count < 3) {
        date.setDate(date.getDate() + 1); // move to next day
      }
    }

    return date;
  }

  public static fourthWednesday(year: number, month: number): Date {
    const date = new Date(year, month - 1, 1); // set date to first day of the month
    let count = 0;

    while (count < 4 && date.getMonth() === month - 1) {
      if (date.getDay() === 3) {
        // Wednesday has index 3 in getDay()
        count++;
      }
      if (count < 4) {
        date.setDate(date.getDate() + 1); // move to next day
      }
    }

    return date;
  }

  /**
   * Given a year and a month, calculate the Nth trading day. A trading day doesn't include Saturday or Sunday.
   * @param year Contract year
   * @param month Contract month
   * @param NumberOfTradingDay The number of the trading day.
   * @param isReverse If true, start counting from the end of the month.
   */
  public static NthTradingDay(
    year: number,
    month: number,
    NumberOfTradingDay: number,
    isReverse: boolean,
  ): Date {
    let date;
    let count = 0;

    if (isReverse) {
      // Set date to last day of the month
      date = new Date(year, month, 0);
      while (count < NumberOfTradingDay && date.getMonth() === month - 1) {
        if (date.getDay() !== 6 && date.getDay() !== 0) {
          // Saturday and Sunday has index 6 and 0 in getDay()
          count++;
        }
        if (count < NumberOfTradingDay) {
          date.setDate(date.getDate() - 1); // move to previous day
        }
      }
    } else {
      // set date to first day of the month
      date = new Date(year, month - 1, 1);
      while (count < NumberOfTradingDay && date.getMonth() === month - 1) {
        if (date.getDay() !== 6 && date.getDay() !== 0) {
          // Saturday and Sunday has index 6 and 0 in getDay()
          count++;
        }
        if (count < NumberOfTradingDay) {
          date.setDate(date.getDate() + 1); // move to next day
        }
      }
    }

    return date;
  }

  public static getNextQuarterMonth(month: number): number {
    let endMonth;

    if (month < 2 || month > 10) {
      endMonth = 3; // March
    } else if (month < 5) {
      endMonth = 6; // June
    } else if (month < 8) {
      endMonth = 9; // September
    } else {
      endMonth = 12; // December
    }

    return endMonth;
  }

  public static getNextNextQuarterMonth(month: number): number {
    let endMonth;

    if (month < 2 || month > 10) {
      endMonth = 6; // March
    } else if (month < 5) {
      endMonth = 9; // June
    } else if (month < 8) {
      endMonth = 12; // September
    } else {
      endMonth = 3; // December
    }

    return endMonth;
  }

  // todo: Refactor to remove underlying from Calendar.ts
  public static getExpirationDays(underlying: string, contract: string): number {
    const year = 2000 + parseInt(contract.substring(0, 2));
    const month = parseInt(contract.substring(2, 4));

    let expireDate: Date = new Date();
    if (underlying === 'io' || underlying === 'ho' || underlying === 'mo') {
      expireDate = Calendar.thirdFriday(year, month);
    } else if (
      underlying === '510050' ||
      underlying === '510300' ||
      underlying === '510500' ||
      underlying === '588000' ||
      underlying === '588080' ||
      underlying === '159915' ||
      underlying === '159919' ||
      underlying === '159922' ||
      underlying === '159901'
    ) {
      expireDate = Calendar.fourthWednesday(year, month);
    } else if (underlying === 'au') {
      // Not because of js's month starts from 0, because au option requires the previous month of the contract month.
      expireDate = Calendar.NthTradingDay(year, month - 1, 5, true);
    } else {
      throw new Error(`Don't know how to calculate expiration date of ${underlying}.`);
    }
    const today = new Date();
    const diffTime = Math.abs(expireDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  public static getEtfCurrentMonthString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const fourthWednesdayDate = Calendar.fourthWednesday(year, month).getDate();
    const shortYear = year.toString().substring(2);

    if (today.getDate() <= fourthWednesdayDate) {
      const monthString = month.toString().padStart(2, '0');
      return `${shortYear}${monthString}`;
    } else {
      const nextMonth = (month + 1).toString().padStart(2, '0');
      return `${shortYear}${nextMonth}`;
    }
  }

  public static getEtfNextMonthString(): string {
    const monthString = this.getEtfCurrentMonthString();
    const currentYear = +monthString.substring(0, 2);
    const currentMonth = +monthString.substring(2);

    if (currentMonth < 12) {
      return `${currentYear}${(currentMonth + 1).toString().padStart(2, '0')}`;
    } else {
      return `${currentYear + 1}01`;
    }
  }

  public static getEtfNextQuarterString(): string {
    const monthString = this.getEtfCurrentMonthString();
    const currentYear = +monthString.substring(0, 2);
    const currentMonth = +monthString.substring(2);
    const nextQuarter = this.getNextQuarterMonth(currentMonth);

    if (currentMonth < 11) {
      return `${currentYear}${nextQuarter.toString().padStart(2, '0')}`;
    } else {
      return `${currentYear + 1}03`;
    }
  }

  public static getEtfNextNextQuarterString(): string {
    const monthString = this.getEtfCurrentMonthString();
    const currentYear = +monthString.substring(0, 2);
    const currentMonth = +monthString.substring(2);
    const nextNextQuarter = this.getNextNextQuarterMonth(currentMonth);

    if (currentMonth < 8) {
      return `${currentYear}${nextNextQuarter.toString().padStart(2, '0')}`;
    } else {
      return `${currentYear + 1}${nextNextQuarter.toString().padStart(2, '0')}`;
    }
  }
}
