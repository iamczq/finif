import { Trade } from "../../trade/trade";
import { PositionStatus } from "./positionStatus";

export enum SyntheticSpotPositionTypes {
    Long = 'LONG',
    Short = 'SHORT',
};

export class SyntheticSpotPosition {
    contract: string; // '510300C2112M5000',
    type: SyntheticSpotPositionTypes;
    status: PositionStatus;
    trade: Trade[];

    constructor(initializer: {
        contract: string;
        type: SyntheticSpotPositionTypes;
        status: PositionStatus;
        trade: Trade[];
    }) {
        this.contract = initializer.contract;
        this.type = initializer.type;
        this.status = initializer.status;
        this.trade = initializer.trade;
    }
}