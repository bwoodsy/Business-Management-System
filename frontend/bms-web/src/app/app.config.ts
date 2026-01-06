import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './credentials.interceptor';

const useHashLocation = typeof window !== 'undefined' && window.location.protocol === 'file:';

export const appConfig: ApplicationConfig = {
  providers: [
    useHashLocation ? provideRouter(routes, withHashLocation()) : provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor]))
  ]
};
