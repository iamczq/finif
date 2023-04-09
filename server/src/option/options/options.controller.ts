import { Controller, Get, Param } from '@nestjs/common';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionService: OptionsService) {}

  @Get(':id/:contract')
  public async getQuote(
    @Param('id') id: string,
    @Param('contract') contract: string,
  ) {
    return await this.optionService.getQuote(id, contract);
  }
}
