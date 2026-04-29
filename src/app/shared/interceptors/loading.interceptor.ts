import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

let activeRequests = 0;

export const loadingInterceptor = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const spinner = inject(NgxSpinnerService);
  
  if (activeRequests === 0) {
    spinner.show();
  }

  activeRequests++;

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        spinner.hide();
      }
    })
  );
};
