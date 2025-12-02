import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InversionesService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getTimeSeries(userId: number) {
    return this.http.get<any[]>(`${this.api}/inversiones/${userId}/timeseries/`);
  }
}

