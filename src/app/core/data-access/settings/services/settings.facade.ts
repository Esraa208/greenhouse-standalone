import { Injectable, inject, signal } from '@angular/core';
import { SettingsRepository, SystemSettings, UserAccount } from './settings.repository';
import { GhToastService } from '@app/core';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  readonly #repo = inject(SettingsRepository);
  readonly #toast = inject(GhToastService);

  readonly #settings = signal<SystemSettings | null>(null);
  readonly #users = signal<UserAccount[]>([]);
  readonly #isLoading = signal<boolean>(false);
  readonly #activeTab = signal<'system' | 'users'>('system');

  readonly settings = this.#settings.asReadonly();
  readonly users = this.#users.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly activeTab = this.#activeTab.asReadonly();

  loadAll(): void {
    this.#isLoading.set(true);
    forkJoin({
      prefs: this.#repo.getSystemSettings(),
      users: this.#repo.getUsers()
    }).subscribe({
      next: (res) => {
        this.#settings.set(res.prefs);
        this.#users.set(res.users);
        this.#isLoading.set(false);
      },
      error: () => this.#isLoading.set(false)
    });
  }

  setTab(tab: 'system' | 'users'): void {
    this.#activeTab.set(tab);
  }

  saveSettings(newSettings: SystemSettings): void {
    this.#isLoading.set(true);
    this.#repo.saveSystemSettings(newSettings).subscribe({
      next: (saved) => {
        this.#settings.set(saved);
        this.#isLoading.set(false);
        this.#toast.success('تم حفظ الإعدادات بنجاح');
      },
      error: () => {
        this.#isLoading.set(false);
        this.#toast.error('حدث خطأ أثناء حفظ الإعدادات');
      }
    });
  }
}






