import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment';
import { getStoredAuthToken, isDesktopRuntime } from './auth-token';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = environment.apiBaseUrl;
  const isApiRequest = apiBaseUrl ? req.url.startsWith(apiBaseUrl) : req.url.startsWith('/api/');

  if (isApiRequest) {
    const token = getStoredAuthToken();
    const isDesktop = isDesktopRuntime();

    console.log('[Interceptor]', {
      url: req.url,
      isDesktop,
      hasToken: !!token,
      tokenLength: token?.length
    });

    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    } else if (!isDesktop) {
      // Only use cookie-based auth in web mode
      req = req.clone({ withCredentials: true });
    }
    // In desktop mode without a token, don't set withCredentials
    // This allows login/register to work on first attempt
  }

  return next(req);
};
