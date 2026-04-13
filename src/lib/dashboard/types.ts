// ── Report summary ─────────────────────────────────────────────────────────

export interface ReportSummary {
  id: string;
  venueName: string;
  dayOfWeek: string;
  enteredBy: string;
  status: string;
  // Financial
  cash: number;
  eftpos: number;
  vouchers: number;
  hotelChargeback: number;
  totalTrade: number;
  // Sales channels
  online: number;
  phone: number;
  dineIn: number;
  takeaway: number;
  deliveries: number;
  salesChannelTotal: number;
  // Staffing
  fohJuniors: number | null;
  fohRsa: number | null;
  voids: number;
  // Operations
  busyLevel: string | null;
  eventRunning: boolean;
  eventName: string | null;
  eventType: string | null;
  weatherCondition: string | null;
  weatherImpactNote: string | null;
  notes: string | null;
  // Sign-off
  signedOff: boolean;
  signedOffBy: string | null;
  signedOffAt: Date | null;
  finalizedAt: Date | null;
  isBackdated: boolean;
}

// ── Per-day container ──────────────────────────────────────────────────────

export interface DailyResult {
  date: Date;
  report: ReportSummary | null;
  hasReport: boolean;
}

// ── Weekly aggregate ───────────────────────────────────────────────────────

export interface WeeklyResult {
  weekStart: Date;
  weekEnd: Date;
  days: DailyResult[];
  totalTrade: number;
  avgDailyTrade: number;
  bestDay: { date: Date; total: number; dayOfWeek: string } | null;
  worstDay: { date: Date; total: number; dayOfWeek: string } | null;
  totalVoids: number;
  totalCash: number;
  totalEftpos: number;
  totalVouchers: number;
  totalChargeback: number;
  totalOnline: number;
  totalPhone: number;
  totalDineIn: number;
  totalTakeaway: number;
  totalDeliveries: number;
  finalisedCount: number;
  draftCount: number;
  missingDays: Date[];
  eventDays: number;
  weatherTags: string[];
}

// ── Monthly aggregate ──────────────────────────────────────────────────────

export interface WeeklyTotal {
  weekStart: Date;
  total: number;
}

export interface MonthlyResult {
  year: number;
  month: number;
  monthName: string;
  days: DailyResult[];
  totalTrade: number;
  avgDailyTrade: number;
  bestDay: { date: Date; total: number; dayOfWeek: string } | null;
  bestWeek: WeeklyTotal | null;
  totalVoids: number;
  voucherTotal: number;
  chargebackTotal: number;
  totalCash: number;
  totalEftpos: number;
  salesChannelTotal: number;
  finalisedCount: number;
  totalReports: number;
  completionRate: number;
  weeklyTotals: WeeklyTotal[];
}

// ── Compliance ─────────────────────────────────────────────────────────────

export interface ComplianceData {
  todayStatus: "missing" | "draft" | "finalized";
  thisWeekFinalized: number;
  thisWeekDaysElapsed: number;
  thisWeekMissingDays: number;
  thisMonthFinalized: number;
  thisMonthTotal: number;
  recentMissingDates: Date[];
}

// ── KPI cards ──────────────────────────────────────────────────────────────

export interface KpiData {
  totalTrade: number;
  totalCash: number;
  totalEftpos: number;
  totalVoids: number;
  finalisedCount: number;
  avgDailyTrade: number;
  periodLabel: string;
}

// ── Notes / Operations panel ───────────────────────────────────────────────

export interface NoteEntry {
  reportId: string;
  date: Date;
  dayOfWeek: string;
  busyLevel: string | null;
  eventRunning: boolean;
  eventName: string | null;
  weatherCondition: string | null;
  notes: string | null;
}

// ── Report filter ──────────────────────────────────────────────────────────

export interface ReportFilters {
  status?: "DRAFT" | "FINALIZED" | null;
  from?: Date | null;
  to?: Date | null;
  enteredBy?: string | null;
  busyLevel?: string | null;
  eventRunning?: boolean | null;
  page?: number;
}

// ── Chart helpers ──────────────────────────────────────────────────────────

export interface ChartBar {
  label: string;
  value: number;
  sublabel?: string;
}
