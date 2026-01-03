import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = environment.apiBaseUrl;
  const isApiRequest = apiBaseUrl ? req.url.startsWith(apiBaseUrl) : req.url.startsWith('/api/');

  if (isApiRequest) {
    req = req.clone({ withCredentials: true });
  }

  return next(req);
};
