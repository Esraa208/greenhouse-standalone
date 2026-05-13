import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface SystemSettings {
  defaultCurrency: string;
  dateFormat: string;
  enableNotifications: boolean;
  alertThresholdTempHigh: number;
  alertThresholdTempLow: number;
  alertThresholdHumidity: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  status: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class SettingsRepository {

  getSystemSettings(): Observable<SystemSettings> {
    const mock: SystemSettings = {
      defaultCurrency: 'SAR',
      dateFormat: 'DD/MM/YYYY',
      enableNotifications: true,
      alertThresholdTempHigh: 30,
      alertThresholdTempLow: 15,
      alertThresholdHumidity: 85
    };
    return of(mock).pipe(delay(400));
  }

  saveSystemSettings(settings: SystemSettings): Observable<SystemSettings> {
    return of(settings).pipe(delay(500));
  }

  getUsers(): Observable<UserAccount[]> {
    const mock: UserAccount[] = [
      { id: '1', name: 'أحمد محمود', email: 'ahmed@greenhouse.com', role: 'admin', status: 'active' },
      { id: '2', name: 'سارة خالد', email: 'sara@greenhouse.com', role: 'manager', status: 'active' },
      { id: '3', name: 'عمر ياسر', email: 'omar@greenhouse.com', role: 'operator', status: 'inactive' }
    ];
    return of(mock).pipe(delay(400));
  }
}







