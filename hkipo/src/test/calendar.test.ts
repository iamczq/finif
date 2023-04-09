import { Calendar } from "../util/calendar";
import moment from "moment";

// Test some typical expire dates. Wednesday, Friday.
test('2201 4th Wednesday', () => {
    const d1 = Calendar.getExpireDate('2201', 4, 3);
    const d2 = moment('2022-01-26');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2202 4th Wednesday', () => {
    const d1 = Calendar.getExpireDate('2202', 4, 3);
    const d2 = moment('2022-02-23');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2201 3th Friday', () => {
    const d1 = Calendar.getExpireDate('2201', 3, 5);
    const d2 = moment('2022-01-21');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2202 3th Friday', () => {
    const d1 = Calendar.getExpireDate('2202', 3, 5);
    const d2 = moment('2022-02-18');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

// Test other days.
test('2201 1st Saturday', () => {
    const d1 = Calendar.getExpireDate('2201', 1, 6);
    const d2 = moment('2022-01-01');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2201 1st Sunday', () => {
    const d1 = Calendar.getExpireDate('2201', 1, 0);
    const d2 = moment('2022-01-02');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2205 1st Saturday', () => {
    const d1 = Calendar.getExpireDate('2205', 1, 6);
    const d2 = moment('2022-05-07');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});

test('2205 1st Sunday', () => {
    const d1 = Calendar.getExpireDate('2205', 1, 0);
    const d2 = moment('2022-05-01');    
    expect(d1.toISOString()).toBe(d2.toISOString());
});
