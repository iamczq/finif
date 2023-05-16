import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OptionYieldsComponent } from './options/option-yields/option-yields.component';

const routes: Routes = [
  {path: 'option-yields', component: OptionYieldsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
