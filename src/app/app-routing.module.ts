import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginRegistroComponent } from './login-registro/login-registro.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path:'', redirectTo: 'login', pathMatch: 'full'},
  { path:'login', component: LoginRegistroComponent },
  {path:'home', component: HomeComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
