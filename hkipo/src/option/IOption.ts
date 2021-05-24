export interface IOption {
    // 基本信息
    code: string,
    executionPrice: number,
    price: number,
    buyVol: number,
    buyPrice: number,
    sellPrice: number,
    sellVol: number,
    position: number,
    changePercent: number,
    underlyingPrice: number,
    // 风险值
    timeValue: () => number,
    // intrinsicValue: number,
    // delta: number,
    // gamma: number,
    // theta: number,
    // vega: number,
    // iv: number,
}

export interface IOptionPair {
    code: string,
    call: IOption,
    put: IOption,
}