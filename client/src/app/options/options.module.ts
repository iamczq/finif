import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { OptionYieldsComponent } from './option-yields/option-yields.component';
import { EmulatorComponent } from './emulator/emulator.component';

@NgModule({
  declarations: [
    OptionYieldsComponent,
    EmulatorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
  ]
})
export class OptionsModule { }
