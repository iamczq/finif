import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class SinaContractCode extends Document {
    @Prop()
    underlying: string;

    @Prop()
    contractMonth: string;

    @Prop()
    strike?: string;

    @Prop()
    code: string;
}

export const SinaContractCodeSchema = SchemaFactory.createForClass(SinaContractCode);