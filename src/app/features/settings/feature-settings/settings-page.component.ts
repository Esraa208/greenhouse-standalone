import { ChangeDetectionStrategy, Component, effect, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GhPageHeaderComponent, GhSegmentedControlComponent, GhButtonComponent, GhBadgeComponent, SkeletonComponent, InputComponent, SelectComponent } from '@app/shared/components';
import { SettingsFacade, UserAccount, SystemSettings } from '@app/core/data-access/settings';
import { TranslationService } from '@app/core';
import { TranslatePipe } from '@app/shared/pipes';

@Component({
  selector: 'gh-feature-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GhPageHeaderComponent,
    GhSegmentedControlComponent,
    GhButtonComponent,
    GhBadgeComponent,
    SkeletonComponent,
    InputComponent,
    SelectComponent,
    TranslatePipe
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  readonly facade = inject(SettingsFacade);
  readonly i18n = inject(TranslationService);
  readonly #fb = inject(FormBuilder);

  readonly settings: Signal<SystemSettings | null> = this.facade.settings;
  readonly users: Signal<UserAccount[]> = this.facade.users;
  readonly activeTab: Signal<'system' | 'users'> = this.facade.activeTab;
  readonly isLoading: Signal<boolean> = this.facade.isLoading;

  readonly form = this.#fb.nonNullable.group({
    defaultCurrency: ['', Validators.required],
    dateFormat: ['', Validators.required],
    alertThresholdTempHigh: [0, Validators.required],
    alertThresholdTempLow: [0, Validators.required],
    alertThresholdHumidity: [0, Validators.required],
  });

  constructor() {
    // Sync external state into local form seamlessly on load
    effect(() => {
      const s = this.settings();
      if (s) {
        this.form.patchValue({
          defaultCurrency: s.defaultCurrency,
          dateFormat: s.dateFormat,
          alertThresholdTempHigh: s.alertThresholdTempHigh,
          alertThresholdTempLow: s.alertThresholdTempLow,
          alertThresholdHumidity: s.alertThresholdHumidity
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.facade.loadAll();
  }

  onTabChange(tab: string): void {
    this.facade.setTab(tab as 'system' | 'users');
  }

  saveSettings(): void {
    const current = this.settings();
    if (this.form.valid && current) {
      // Safely merge with original to keep untracked boolean fields
      this.facade.saveSettings({ ...current, ...this.form.getRawValue() });
    }
  }

  trackByUserId = (_: number, item: UserAccount) => item.id;
}






