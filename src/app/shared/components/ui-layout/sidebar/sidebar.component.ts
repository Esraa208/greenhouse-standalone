// libs/shared/ui-layout/src/lib/sidebar/sidebar.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes';

export interface NavItem {
  readonly key: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly path: string;
}

export interface NavSection {
  readonly titleKey: string;
  readonly items: ReadonlyArray<NavItem>;
}

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    titleKey: 'nav.section.main',
    items: [
      { key: 'dashboard', labelKey: 'nav.dashboard', icon: '📊', path: '/dashboard' },
    ],
  },
  {
    titleKey: 'nav.section.infrastructure',
    items: [
      { key: 'locations',    labelKey: 'nav.locations',    icon: '📍', path: '/locations' },
      { key: 'greenhouses',  labelKey: 'nav.greenhouses',  icon: '🏡', path: '/greenhouses' },
      { key: 'zones',        labelKey: 'nav.zones',        icon: '🗂️', path: '/zones' },
      { key: 'systems',      labelKey: 'nav.systems',      icon: '⚙️',  path: '/systems' },
      { key: 'layers',       labelKey: 'nav.layers',       icon: '🔲', path: '/layers' },
      // { key: 'pipes',        labelKey: 'nav.pipes',        icon: '🪣', path: '/pipes' },
    ],
  },
  {
    titleKey: 'nav.section.operations',
    items: [
      { key: 'crops',       labelKey: 'nav.crops',       icon: '🌱', path: '/crops' },
      { key: 'batches',     labelKey: 'nav.batches',     icon: '📦', path: '/batches' },
      { key: 'allocations', labelKey: 'nav.allocations', icon: '🔀', path: '/allocations' },
      { key: 'losses',      labelKey: 'nav.losses',      icon: '📉', path: '/losses' },
      // { key: 'harvest',     labelKey: 'nav.harvest',     icon: '🌾', path: '/harvest' },
    ],
  },
  {
    titleKey: 'nav.section.sales',
    items: [
      { key: 'customers',     labelKey: 'nav.customers',     icon: '👥', path: '/customers' },
      { key: 'invoices',      labelKey: 'nav.invoices',      icon: '🧾', path: '/invoices' },
      // { key: 'sales-reports', labelKey: 'nav.sales_reports', icon: '💰', path: '/sales-reports' },
    ],
  },
  {
    titleKey: 'nav.section.reports',
    items: [
      // { key: 'reports', labelKey: 'nav.reports', icon: '📈', path: '/reports' },
      { key: 'sales-reports', labelKey: 'nav.sales_reports', icon: '💰', path: '/sales-reports' },
    ],
  },
  {
    titleKey: 'nav.section.system',
    items: [
      { key: 'settings', labelKey: 'nav.settings', icon: '⚙️', path: '/settings' },
    ],
  },
];

@Component({
  selector: 'gh-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly currentRoute = input<string>('');
  readonly isOpen = model<boolean>(false);

  readonly sections = signal<ReadonlyArray<NavSection>>(NAV_SECTIONS);
  readonly collapsedSections = signal<Set<string>>(new Set());

  isActive(path: string): boolean {
    const route = this.currentRoute();
    return route === path || route.startsWith(path + '/');
  }

  isCollapsed(titleKey: string): boolean {
    return this.collapsedSections().has(titleKey);
  }

  toggleSection(titleKey: string): void {
    this.collapsedSections.update(set => {
      const updated = new Set(set);
      if (updated.has(titleKey)) {
        updated.delete(titleKey);
      } else {
        updated.add(titleKey);
      }
      return updated;
    });
  }

  closeMobile(): void {
    this.isOpen.set(false);
  }

  trackSection = (_: number, s: NavSection) => s.titleKey;
  trackItem = (_: number, i: NavItem) => i.key;
}






