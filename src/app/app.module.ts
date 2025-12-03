import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { LoginRegistroComponent } from './login-registro/login-registro.component';
import { HomeComponent } from './home/home.component';
import { CommonModule } from '@angular/common';

//GRAFICOS:
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AppComponent,
    LoginRegistroComponent,
    HomeComponent
  ],
  imports: [
    BaseChartDirective,
    HttpClientModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
