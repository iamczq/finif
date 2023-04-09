import { Module } from '@nestjs/common';
import { OptionsService } from './options/options.service';
import { SinaEtfOptionDataProviderService } from './data-providers/sina-etf-option-data-provider.service';
import { OptionDataProviderFactoryService } from './data-providers/option-data-provider-factory.service';
import { OptionsController } from './options/options.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SinaContractCode, SinaContractCodeSchema } from './entities/contract.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: SinaContractCode.name,
      schema: SinaContractCodeSchema,
    }])
  ],
  controllers: [
    OptionsController
  ],
  providers: [
    OptionsService,
    SinaEtfOptionDataProviderService,
    OptionDataProviderFactoryService
  ]
})
export class OptionModule { }
