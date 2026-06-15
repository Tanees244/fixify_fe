import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private http = inject(HttpClient);
  private baseUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
}
