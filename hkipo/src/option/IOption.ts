export interface IOption {
    code: string,
    executionPrice: number,
    price: number,
    buyVol: number,
    buyPrice: number,
    sellPrice: number,
    sellVol: number,
    position: number,
    changePercent: number,
}

export interface IOptionPair {
    call: IOption,
    put: IOption
}