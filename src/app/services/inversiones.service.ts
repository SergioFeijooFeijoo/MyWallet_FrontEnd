import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InversionesService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTimeSeries(userId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/inversiones/${userId}/timeseries/`);
  }
}

