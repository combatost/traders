import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment'; // <-- add this import

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private API_URL = 'https://api.pexels.com/videos/search?query=futuristic&per_page=1';

  constructor(private http: HttpClient) {}

  getFuturisticVideo(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: environment.pexelsApiKey
    });
    return this.http.get(this.API_URL, { headers });
  }
}
