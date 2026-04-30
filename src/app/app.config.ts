import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { BsModalService } from 'ngx-bootstrap/modal';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { loadingInterceptor } from './shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    NgxSpinnerService,
    JwtHelperService,
    BsModalService,
    {
      provide: JWT_OPTIONS,
      useValue: {}
    }
  ],
};
