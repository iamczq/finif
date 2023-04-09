import moment from "moment";

export class Calendar {
  public static getExpireDate(shortMonth: string, numberOf: number, weekday: number): moment.Moment {
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

  public static thirdFriday(year: number, month: number): number {
    let date = new Date(year, month - 1, 1); // set date to first day of the month
    let count = 0;

    while (count < 3 && date.getMonth() === month - 1) {
      if (date.getDay() === 5) { // Friday has index 5 in getDay()
        count++;
      }
      if (count < 3) {
        date.setDate(date.getDate() + 1); // move to next day
      }
    }

    return date.getDate();
  }

  public static fourthWednesday(year: number, month: number): number {
    let date = new Date(year, month - 1, 1); // set date to first day of the month
    let count = 0;

    while (count < 4 && date.getMonth() === month - 1) {
      if (date.getDay() === 3) { // Wednesday has index 3 in getDay()
        count++;
      }
      if (count < 4) {
        date.setDate(date.getDate() + 1); // move to next day
      }
    }

    return date.getDate();
  }

  public static getNextQuarterMonth(month: number): number {
    let endMonth;

    if (month < 2 || month > 10) {
      endMonth = 3;  // March
    } else if (month < 5) {
      endMonth = 6;  // June
    } else if (month < 8) {
      endMonth = 9;  // September
    } else {
      endMonth = 12;  // December
    }

    return endMonth;
  }

  public static getNextNextQuarterMonth(month: number): number {
    let endMonth;

    if (month < 2 || month > 10) {
      endMonth = 6;  // March
    } else if (month < 5) {
      endMonth = 9;  // June
    } else if (month < 8) {
      endMonth = 12;  // September
    } else {
      endMonth = 3;  // December
    }

    return endMonth;
  }

  public static getEtfCurrentMonthString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const fourthWednesdayDate = Calendar.fourthWednesday(year, month);
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