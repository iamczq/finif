import { FinancialOption } from "../option/financialOption";

test('A simple option test.', () => {

    const f = new FinancialOption({
        code: 'io2205-c-5000',
        month: '2205',
        type: 'C',
        executionPrice: 5000,
        price: 100,
        buyVol: 1,
        buyPrice: 1,
        sellPrice: 1,
        sellVol: 1,
        position: 1,
        changePercent: 0.01,
        underlyingPrice: 5100,
    });
    expect(f.timeValue).toBe(0);
    expect(f.intrinsicValue).toBe(100);
    
    f.price = 200;
    expect(f.timeValue).toBe(100);
    expect(f.intrinsicValue).toBe(100);
});