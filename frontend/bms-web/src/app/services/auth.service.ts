import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { isDesktopRuntime, setStoredAuthToken } from '../auth-token';

export interface UserInfo {
  id: string;
  username: string;
}

interface AuthResponse {
  message: string;
  token?: string;
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
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/login`, { username, password })
      .pipe(
        tap((response) => {
          console.log('[Auth] Login response:', {
            isDesktop: isDesktopRuntime(),
            hasToken: !!response?.token,
            response
          });
          if (isDesktopRuntime() && response?.token) {
            setStoredAuthToken(response.token);
            console.log('[Auth] Token stored');
          }
        }),
        // Chain the auth check so we wait for it to complete
        switchMap(() => this.fetchUser()),
        catchError(err => {
          console.error('[Auth] Login error:', err);
          this.error.set('Login failed');
          this.loading.set(false);
          return of(null);
        })
      );
  }

  register(username: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/register`, { username, password })
      .pipe(
        tap((response) => {
          if (isDesktopRuntime() && response?.token) {
            setStoredAuthToken(response.token);
          }
        }),
        // Chain the auth check so we wait for it to complete
        switchMap(() => this.fetchUser()),
        catchError(err => {
          this.error.set('Registration failed');
          this.loading.set(false);
          return of(null);
        })
      );
  }

  logout() {
    if (isDesktopRuntime()) {
      setStoredAuthToken(null);
    }

    this.http.post(`${environment.apiBaseUrl}/api/auth/logout`, {}).subscribe({
      next: () => {
        this.user.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.user.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  // Returns an Observable for chaining (used by login/register)
  private fetchUser() {
    return this.http.get<UserInfo>(`${environment.apiBaseUrl}/api/auth/me`).pipe(
      tap((user) => {
        console.log('[Auth] User authenticated:', user);
        this.user.set(user);
        this.loading.set(false);
      }),
      catchError((err) => {
        console.log('[Auth] Not authenticated:', err.status, err.message);
        this.user.set(null);
        this.loading.set(false);
        if (isDesktopRuntime() && err?.status === 401) {
          setStoredAuthToken(null);
        }
        return of(null);
      })
    );
  }

  checkAuth() {
    console.log('[Auth] Checking authentication...');
    this.fetchUser().subscribe();
  }

  isAuthenticated() {
    return !!this.user();
  }
}
