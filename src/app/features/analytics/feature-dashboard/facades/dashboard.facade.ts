import { Injectable, signal, computed } from '@angular/core';
import {
  KpiCard, ProductionDataPoint, ZoneProduction,
  CropDistribution, InsightCard, BatchStatusCard,
  CapacityZone, FinancialItem
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {

  readonly #dateRange = signal<'30d' | '90d' | '1y'>('30d');
  readonly dateRange = this.#dateRange.asReadonly();

  readonly kpiCards = signal<KpiCard[]>([
    {
      id: 'production',
      title: 'الإنتاج الكلي',
      value: '2,100 كجم',
      change: '+12.5% من الشهر السابق',
      changeType: 'up',
      iconBg: 'bg-green',
      sparklineData: [1250,1300,1450,1520,1680,1750,1820,1900,1950,2100],
      sparklineColor: '#10b981',
    },
    {
      id: 'revenue',
      title: 'الإيرادات',
      value: '147,000 ج.م',
      change: '+8.3% من الشهر السابق',
      changeType: 'up',
      iconBg: 'bg-blue',
      sparklineData: [87500,92000,101500,108000,117600,122000,127400,132000,136500,147000],
      sparklineColor: '#3b82f6',
    },
    {
      id: 'profit',
      title: 'صافي الربح',
      value: '52,920 ج.م',
      change: '+15.2% من الشهر السابق',
      changeType: 'up',
      iconBg: 'bg-purple',
      sparklineData: [31500,33120,36540,38880,42336,43920,45856,47520,49140,52920],
      sparklineColor: '#8b5cf6',
    },
    {
      id: 'plants',
      title: 'النباتات النشطة',
      value: '15,680',
      change: '+1,200 هذا الشهر',
      changeType: 'up',
      iconBg: 'bg-green',
      sparklineData: [14200,14350,14480,14620,14800,15000,15180,15320,15480,15680],
      sparklineColor: '#10b981',
    },
    {
      id: 'batches',
      title: 'عدد الـ Batches',
      value: '24',
      change: '+3 هذا الأسبوع',
      changeType: 'up',
      iconBg: 'bg-orange',
      sparklineData: [18,19,19,20,21,21,22,22,23,24],
      sparklineColor: '#f59e0b',
    },
    {
      id: 'success',
      title: 'نسبة النجاح',
      value: '94.2%',
      change: '+2.1% من الشهر السابق',
      changeType: 'up',
      iconBg: 'bg-green',
      sparklineData: [89,90,91,91.5,92,92.5,93,93.2,93.8,94.2],
      sparklineColor: '#10b981',
    },
  ]);

  readonly productionData = signal<ProductionDataPoint[]>([
    { id: 'oct', month: 'أكتوبر', production: 1250, revenue: 87500,  target: 1500 },
    { id: 'nov', month: 'نوفمبر', production: 1450, revenue: 101500, target: 1500 },
    { id: 'dec', month: 'ديسمبر', production: 1680, revenue: 117600, target: 1700 },
    { id: 'jan', month: 'يناير',  production: 1820, revenue: 127400, target: 1800 },
    { id: 'feb', month: 'فبراير', production: 1950, revenue: 136500, target: 1900 },
    { id: 'mar', month: 'مارس',   production: 2100, revenue: 147000, target: 2000 },
  ]);

  readonly zoneProduction = signal<ZoneProduction[]>([
    { id: 'zone-a', name: 'المنطقة أ', value: 2100, color: '#10b981' },
    { id: 'zone-b', name: 'المنطقة ب', value: 1850, color: '#3b82f6' },
    { id: 'zone-c', name: 'المنطقة ج', value: 1650, color: '#8b5cf6' },
    { id: 'zone-d', name: 'المنطقة د', value: 1200, color: '#f59e0b' },
  ]);

  readonly cropDistribution = signal<CropDistribution[]>([
    { id: 'lettuce', name: 'خس أخضر', value: 35, color: '#10b981' },
    { id: 'basil',   name: 'ريحان',    value: 25, color: '#8b5cf6' },
    { id: 'tomato',  name: 'طماطم',    value: 20, color: '#ef4444' },
    { id: 'mint',    name: 'نعناع',    value: 12, color: '#3b82f6' },
    { id: 'other',   name: 'أخرى',     value: 8,  color: '#6b7280' },
  ]);

  readonly insights = signal<InsightCard[]>([
    { id: 'i1', type: 'success', icon: '✓', title: 'أداء ممتاز',       message: 'معدل النمو هذا الشهر +18% عن المتوسط' },
    { id: 'i2', type: 'warning', icon: '⏰', title: 'اقتراب موعد الحصاد', message: '5 دفعات جاهزة للحصاد خلال 3 أيام' },
    { id: 'i3', type: 'info',    icon: '🎯', title: 'تحقيق الهدف',       message: 'تم تحقيق 105% من الهدف الشهري' },
    { id: 'i4', type: 'warning', icon: '⚠', title: 'سعة منخفضة',       message: 'المنطقة ب - السعة المتبقية أقل من 15%' },
    { id: 'i5', type: 'success', icon: '↑', title: 'زيادة في المبيعات', message: 'ارتفاع الطلب على الخس الأخضر بنسبة 23%' },
  ]);

  readonly batchStatuses = signal<BatchStatusCard[]>([
    { id: 'active',  label: 'دفعات نشطة',       subLabel: 'جاري النمو',      count: 24, bgColor: '#f0fdf4', iconColor: '#16a34a', textColor: '#16a34a', icon: '🌱' },
    { id: 'harvest', label: 'جاهزة للحصاد',     subLabel: 'خلال 7 أيام',    count: 8,  bgColor: '#fefce8', iconColor: '#d97706', textColor: '#d97706', icon: '⏰' },
    { id: 'prep',    label: 'في مرحلة التحضير', subLabel: 'قيد الإعداد',     count: 6,  bgColor: '#eff6ff', iconColor: '#2563eb', textColor: '#2563eb', icon: '🎯' },
  ]);

  readonly capacityZones = signal<CapacityZone[]>([
    { id: 'zone-a', name: 'المنطقة أ', occupied: 4200, total: 5000, color: 'linear-gradient(90deg, #10b981, #34d399)' },
    { id: 'zone-b', name: 'المنطقة ب', occupied: 4650, total: 5000, color: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { id: 'zone-c', name: 'المنطقة ج', occupied: 3200, total: 5000, color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { id: 'zone-d', name: 'المنطقة د', occupied: 3630, total: 5000, color: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
  ]);

  readonly financialItems = signal<FinancialItem[]>([
    { id: 'revenue',  label: 'إجمالي الإيرادات',     value: '147,000 ج.م', percent: 100, color: '#10b981' },
    { id: 'cost',     label: 'تكلفة الإنتاج',        value: '58,800 ج.م',  percent: 40,  color: '#f59e0b' },
    { id: 'ops',      label: 'المصاريف التشغيلية',   value: '35,280 ج.م',  percent: 24,  color: '#3b82f6' },
    { id: 'profit',   label: 'صافي الربح',           value: '52,920 ج.م',  percent: 36,  color: '#8b5cf6' },
  ]);

  readonly capacityPercent = computed(() =>
    this.capacityZones().map(z => ({
      ...z,
      percent: Math.round((z.occupied / z.total) * 100),
      warningNote: Math.round((z.occupied / z.total) * 100) >= 90
        ? ' - قريبة من السعة القصوى' : ''
    }))
  );

  setDateRange(range: '30d' | '90d' | '1y'): void {
    this.#dateRange.set(range);
  }
}





