import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface UserInfo {
  id: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<UserInfo | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuth();
  }

  login(username: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post(`${environment.apiBaseUrl}/api/auth/login`, { username, password }, { withCredentials: true })
      .pipe(
        tap(() => this.checkAuth()),
        catchError(err => {
          this.error.set('Login failed');
          this.loading.set(false);
          return of(null);
        })
      );
  }

  register(username: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post(`${environment.apiBaseUrl}/api/auth/register`, { username, password }, { withCredentials: true })
      .pipe(
        tap(() => this.checkAuth()),
        catchError(err => {
          this.error.set('Registration failed');
          this.loading.set(false);
          return of(null);
        })
      );
  }

  logout() {
    this.http.post(`${environment.apiBaseUrl}/api/auth/logout`, {}, { withCredentials: true }).subscribe(() => {
      this.user.set(null);
      this.router.navigate(['/login']);
    });
  }

  checkAuth() {
    this.http.get<UserInfo>(`${environment.apiBaseUrl}/api/auth/me`, { withCredentials: true }).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => {
        this.user.set(null);
        this.loading.set(false);
      }
    });
  }

  isAuthenticated() {
    return !!this.user();
  }
}
