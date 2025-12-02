import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoginRegistroComponent } from './login-registro/login-registro.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { CommonModule } from '@angular/common';

//GRAFICOS:
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [
    AppComponent,
    LoginRegistroComponent,
    HomeComponent
  ],
  imports: [
    NgChartsModule,
    HttpClientModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    CommonModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
