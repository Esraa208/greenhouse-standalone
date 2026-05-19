import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor, errorInterceptor, loadingInterceptor } from '@app/core';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  Chart,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Filler, Tooltip, Legend
} from 'chart.js';

registerLocaleData(localeAr);

// Register ALL Chart.js components needed
Chart.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Filler, Tooltip, Legend
);

import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor, loadingInterceptor])
    ),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    provideCharts(withDefaultRegisterables()),
  ],
};







