import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OptionYieldsComponent } from './options/option-yields/option-yields.component';
import { EmulatorComponent } from './options/emulator/emulator.component';

const routes: Routes = [
  {path: 'option-yields', component: OptionYieldsComponent},
  {path: 'emulator', component: EmulatorComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
