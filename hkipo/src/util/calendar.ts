import moment from "moment";

export class calendar {
    public static getExpireDate (shortMonth: string, numberOf: number, weekday: number): moment.Moment {
        if (numberOf % 1 > 0 || weekday % 1 > 0) {
            throw new Error('numberOf weekday should be integer.');
        }
        if (numberOf > 5 || numberOf < 1) {
            throw new Error('numberOf should be 1 to 5.');
        }
        if (weekday > 6 || weekday < 0) {
            throw new Error('weekday should be 0 to 6.');
        }

        const month = '20' + shortMonth.substring(0,2) + '-' + shortMonth.substring(2,4);
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
}