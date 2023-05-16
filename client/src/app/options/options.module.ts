import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OptionYieldsComponent } from './option-yields/option-yields.component';

@NgModule({
  declarations: [
    OptionYieldsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
  ]
})
export class OptionsModule { }
