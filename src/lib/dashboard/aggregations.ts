import { prisma } from "@/lib/prisma";
import type { Report } from "@prisma/client";
import type {
  ReportSummary,
  DailyResult,
  WeeklyResult,
  MonthlyResult,
  ComplianceData,
  KpiData,
  NoteEntry,
  ReportFilters,
  WeeklyTotal,
  ChartBar,
} from "./types";

// ── Date utilities ─────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Monday-based week start */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Decimal helpers ─────────────────────────────────────────────────────────

function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const x = parseFloat(String(v));
  return isNaN(x) ? 0 : x;
}

// ── Report → ReportSummary ─────────────────────────────────────────────────

export function toReportSummary(r: Report): ReportSummary {
  const cash = n(r.cash);
  const eftpos = n(r.eftpos);
  const vouchers = n(r.vouchers);
  const hotelChargeback = n(r.hotelChargeback);
  const online = n(r.online);
  const phone = n(r.phone);
  const dineIn = n(r.dineIn);
  const takeaway = n(r.takeaway);
  const deliveries = n(r.deliveries);

  return {
    id: r.id,
    venueName: r.venueName,
    dayOfWeek: r.dayOfWeek,
    enteredBy: r.enteredBy,
    status: r.status,
    cash,
    eftpos,
    vouchers,
    hotelChargeback,
    totalTrade: cash + eftpos + vouchers + hotelChargeback,
    online,
    phone,
    dineIn,
    takeaway,
    deliveries,
    salesChannelTotal: online + phone + dineIn + takeaway + deliveries,
    fohJuniors: r.fohJuniors,
    fohRsa: r.fohRsa,
    voids: n(r.voids),
    busyLevel: r.busyLevel,
    eventRunning: r.eventRunning,
    eventName: r.eventName,
    eventType: r.eventType,
    weatherCondition: r.weatherCondition,
    weatherImpactNote: r.weatherImpactNote,
    notes: r.notes,
    signedOff: r.signedOff,
    signedOffBy: r.signedOffBy,
    signedOffAt: r.signedOffAt,
    finalizedAt: r.finalizedAt,
    isBackdated: r.isBackdated,
  };
}

// ── Daily aggregation ──────────────────────────────────────────────────────

export async function getDailyResult(date: Date): Promise<DailyResult> {
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const report = await prisma.report.findFirst({
    where: {
      reportDate: { gte: dayStart, lt: dayEnd },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }], // FINALIZED first
  });

  return {
    date: dayStart,
    report: report ? toReportSummary(report) : null,
    hasReport: report !== null,
  };
}

// ── Weekly aggregation ─────────────────────────────────────────────────────

export async function getWeeklyResult(date: Date): Promise<WeeklyResult> {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);
  const today = startOfDay(new Date());

  const reports = await prisma.report.findMany({
    where: { reportDate: { gte: weekStart, lt: weekEnd } },
    orderBy: { reportDate: "asc" },
  });

  // Build day slots Mon–Sun
  const days: DailyResult[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const report = reports.find(
      (r) => r.reportDate >= dayStart && r.reportDate < dayEnd
    );
    return {
      date: dayStart,
      report: report ? toReportSummary(report) : null,
      hasReport: !!report,
    };
  });

  // Days in the past with no report
  const missingDays = days
    .filter((d) => isBefore(d.date, today) && !d.hasReport)
    .map((d) => d.date);

  const withReports = days.filter((d) => d.report !== null).map((d) => d.report!);

  const totalTrade = withReports.reduce((acc, r) => acc + r.totalTrade, 0);
  const reportCount = withReports.length;
  const avgDailyTrade = reportCount > 0 ? totalTrade / reportCount : 0;

  const sorted = [...withReports].sort((a, b) => b.totalTrade - a.totalTrade);
  const bestDay = sorted[0]
    ? { date: days[withReports.indexOf(sorted[0])]?.date ?? weekStart, total: sorted[0].totalTrade, dayOfWeek: sorted[0].dayOfWeek }
    : null;
  const worstDay = sorted[sorted.length - 1] && sorted.length > 0
    ? { date: days[withReports.indexOf(sorted[sorted.length - 1])]?.date ?? weekStart, total: sorted[sorted.length - 1].totalTrade, dayOfWeek: sorted[sorted.length - 1].dayOfWeek }
    : null;

  // Find dates for best/worst using days array
  const bestReport = sorted[0];
  const worstReport = sorted[sorted.length - 1];
  const bestDayEntry = days.find((d) => d.report === bestReport) ?? null;
  const worstDayEntry = days.find((d) => d.report === worstReport) ?? null;

  const weatherTags = [...new Set(withReports.map((r) => r.weatherCondition).filter(Boolean))] as string[];
  const eventDays = withReports.filter((r) => r.eventRunning).length;

  return {
    weekStart,
    weekEnd,
    days,
    totalTrade,
    avgDailyTrade,
    bestDay: bestDayEntry?.report
      ? { date: bestDayEntry.date, total: bestDayEntry.report.totalTrade, dayOfWeek: bestDayEntry.report.dayOfWeek }
      : null,
    worstDay: worstDayEntry?.report && sorted.length > 1
      ? { date: worstDayEntry.date, total: worstDayEntry.report.totalTrade, dayOfWeek: worstDayEntry.report.dayOfWeek }
      : null,
    totalVoids: withReports.reduce((acc, r) => acc + r.voids, 0),
    totalCash: withReports.reduce((acc, r) => acc + r.cash, 0),
    totalEftpos: withReports.reduce((acc, r) => acc + r.eftpos, 0),
    totalVouchers: withReports.reduce((acc, r) => acc + r.vouchers, 0),
    totalChargeback: withReports.reduce((acc, r) => acc + r.hotelChargeback, 0),
    totalOnline: withReports.reduce((acc, r) => acc + r.online, 0),
    totalPhone: withReports.reduce((acc, r) => acc + r.phone, 0),
    totalDineIn: withReports.reduce((acc, r) => acc + r.dineIn, 0),
    totalTakeaway: withReports.reduce((acc, r) => acc + r.takeaway, 0),
    totalDeliveries: withReports.reduce((acc, r) => acc + r.deliveries, 0),
    finalisedCount: withReports.filter((r) => r.status === "FINALIZED").length,
    draftCount: withReports.filter((r) => r.status === "DRAFT").length,
    missingDays,
    eventDays,
    weatherTags,
  };
}

// ── Monthly aggregation ────────────────────────────────────────────────────

export async function getMonthlyResult(
  year: number,
  month: number
): Promise<MonthlyResult> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const today = startOfDay(new Date());
  const totalDays = daysInMonth(year, month);

  const reports = await prisma.report.findMany({
    where: { reportDate: { gte: monthStart, lt: monthEnd } },
    orderBy: { reportDate: "asc" },
  });

  // Build day slots for the month
  const days: DailyResult[] = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const report = reports.find(
      (r) => r.reportDate >= dayStart && r.reportDate < dayEnd
    );
    return {
      date: dayStart,
      report: report ? toReportSummary(report) : null,
      hasReport: !!report,
    };
  });

  const withReports = days.filter((d) => d.report !== null);
  const summaries = withReports.map((d) => d.report!);

  const totalTrade = summaries.reduce((acc, r) => acc + r.totalTrade, 0);
  const avgDailyTrade = summaries.length > 0 ? totalTrade / summaries.length : 0;

  // Best day
  let bestDayEntry: DailyResult | null = null;
  for (const d of withReports) {
    if (!bestDayEntry || d.report!.totalTrade > bestDayEntry.report!.totalTrade) {
      bestDayEntry = d;
    }
  }

  // Weekly totals
  const weeklyMap = new Map<string, WeeklyTotal>();
  for (const d of days) {
    if (!d.report) continue;
    const ws = startOfWeek(d.date);
    const key = ws.toISOString();
    const existing = weeklyMap.get(key);
    if (existing) {
      existing.total += d.report.totalTrade;
    } else {
      weeklyMap.set(key, { weekStart: ws, total: d.report.totalTrade });
    }
  }
  const weeklyTotals = [...weeklyMap.values()].sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );

  const bestWeek = weeklyTotals.reduce<WeeklyTotal | null>(
    (best, w) => (!best || w.total > best.total ? w : best),
    null
  );

  const finalisedCount = summaries.filter((r) => r.status === "FINALIZED").length;

  // Completion rate: days that have elapsed and have a report / total elapsed days
  const elapsedDays = days.filter((d) => !isBefore(today, d.date) && d.date <= today).length;
  const completionRate = elapsedDays > 0 ? (summaries.length / elapsedDays) * 100 : 0;

  return {
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    days,
    totalTrade,
    avgDailyTrade,
    bestDay: bestDayEntry?.report
      ? {
          date: bestDayEntry.date,
          total: bestDayEntry.report.totalTrade,
          dayOfWeek: bestDayEntry.report.dayOfWeek,
        }
      : null,
    bestWeek,
    totalVoids: summaries.reduce((acc, r) => acc + r.voids, 0),
    voucherTotal: summaries.reduce((acc, r) => acc + r.vouchers, 0),
    chargebackTotal: summaries.reduce((acc, r) => acc + r.hotelChargeback, 0),
    totalCash: summaries.reduce((acc, r) => acc + r.cash, 0),
    totalEftpos: summaries.reduce((acc, r) => acc + r.eftpos, 0),
    salesChannelTotal: summaries.reduce((acc, r) => acc + r.salesChannelTotal, 0),
    finalisedCount,
    totalReports: summaries.length,
    completionRate,
    weeklyTotals,
  };
}

// ── Compliance data ────────────────────────────────────────────────────────

export async function getComplianceData(): Promise<ComplianceData> {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = startOfNextMonth(today);

  const [thisWeekReports, thisMonthReports, todayReport] = await Promise.all([
    prisma.report.findMany({
      where: { reportDate: { gte: weekStart, lt: addDays(weekStart, 7) } },
      select: { reportDate: true, status: true },
    }),
    prisma.report.findMany({
      where: { reportDate: { gte: monthStart, lt: monthEnd } },
      select: { status: true },
    }),
    prisma.report.findFirst({
      where: {
        reportDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: { status: true },
    }),
  ]);

  // Days elapsed this week (Mon = 0, today inclusive)
  const dayOfWeek = today.getDay();
  const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek; // Sun = 7th day

  // Find missing days this week
  const missingDays: Date[] = [];
  for (let i = 0; i < daysElapsed; i++) {
    const d = addDays(weekStart, i);
    if (isBefore(d, today)) {
      // Yesterday and before
      const dEnd = new Date(startOfDay(d).getTime() + 24 * 60 * 60 * 1000);
      const hasReport = thisWeekReports.some(
        (r) => r.reportDate >= startOfDay(d) && r.reportDate < dEnd
      );
      if (!hasReport) missingDays.push(d);
    }
  }

  const todayStatus: "missing" | "draft" | "finalized" = todayReport
    ? (todayReport.status === "FINALIZED" ? "finalized" : "draft")
    : "missing";

  return {
    todayStatus,
    thisWeekFinalized: thisWeekReports.filter((r) => r.status === "FINALIZED").length,
    thisWeekDaysElapsed: daysElapsed,
    thisWeekMissingDays: missingDays.length,
    thisMonthFinalized: thisMonthReports.filter((r) => r.status === "FINALIZED").length,
    thisMonthTotal: thisMonthReports.length,
    recentMissingDates: missingDays.slice(0, 5),
  };
}

// ── KPI derivation ─────────────────────────────────────────────────────────

export function deriveKpis(
  view: "daily" | "weekly" | "monthly",
  data: DailyResult | WeeklyResult | MonthlyResult,
  date: Date
): KpiData {
  const monthNames = MONTH_NAMES;

  if (view === "daily") {
    const d = data as DailyResult;
    const r = d.report;
    return {
      totalTrade: r?.totalTrade ?? 0,
      totalCash: r?.cash ?? 0,
      totalEftpos: r?.eftpos ?? 0,
      totalVoids: r?.voids ?? 0,
      finalisedCount: r?.status === "FINALIZED" ? 1 : 0,
      avgDailyTrade: r?.totalTrade ?? 0,
      periodLabel: date.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    };
  }

  if (view === "weekly") {
    const w = data as WeeklyResult;
    return {
      totalTrade: w.totalTrade,
      totalCash: w.totalCash,
      totalEftpos: w.totalEftpos,
      totalVoids: w.totalVoids,
      finalisedCount: w.finalisedCount,
      avgDailyTrade: w.avgDailyTrade,
      periodLabel: `Week of ${w.weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`,
    };
  }

  const m = data as MonthlyResult;
  return {
    totalTrade: m.totalTrade,
    totalCash: m.totalCash,
    totalEftpos: m.totalEftpos,
    totalVoids: m.totalVoids,
    finalisedCount: m.finalisedCount,
    avgDailyTrade: m.avgDailyTrade,
    periodLabel: `${monthNames[m.month - 1]} ${m.year}`,
  };
}

// ── Notes panel ────────────────────────────────────────────────────────────

export async function getRecentNotes(limit = 10): Promise<NoteEntry[]> {
  const reports = await prisma.report.findMany({
    where: {
      OR: [
        { notes: { not: null } },
        { eventRunning: true },
        { busyLevel: { not: null } },
        { weatherCondition: { not: null } },
      ],
    },
    orderBy: { reportDate: "desc" },
    take: limit,
    select: {
      id: true,
      reportDate: true,
      dayOfWeek: true,
      busyLevel: true,
      eventRunning: true,
      eventName: true,
      weatherCondition: true,
      notes: true,
    },
  });

  return reports.map((r) => ({
    reportId: r.id,
    date: r.reportDate,
    dayOfWeek: r.dayOfWeek,
    busyLevel: r.busyLevel,
    eventRunning: r.eventRunning,
    eventName: r.eventName,
    weatherCondition: r.weatherCondition,
    notes: r.notes,
  }));
}

// ── Chart data builders ─────────────────────────────────────────────────────

export function buildWeeklyChartBars(weekly: WeeklyResult): ChartBar[] {
  return weekly.days.map((d) => ({
    label: DAY_SHORT[d.date.getDay()],
    value: d.report?.totalTrade ?? 0,
    sublabel: d.date.getDate().toString(),
  }));
}

export function buildMonthlyChartBars(monthly: MonthlyResult): ChartBar[] {
  return monthly.weeklyTotals.map((w, i) => ({
    label: `Wk ${i + 1}`,
    value: w.total,
    sublabel: w.weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
  }));
}

// ── Filtered reports ────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export async function getFilteredReports(
  filters: ReportFilters
): Promise<{ reports: (Report & { createdBy: { name: string; role: string } })[]; total: number; page: number; pageCount: number }> {
  const page = filters.page ?? 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.from || filters.to) {
    const dateFilter: Record<string, unknown> = {};
    if (filters.from) dateFilter.gte = startOfDay(filters.from);
    if (filters.to) dateFilter.lte = endOfDay(filters.to);
    where.reportDate = dateFilter;
  }
  if (filters.enteredBy) {
    where.enteredBy = { contains: filters.enteredBy };
  }
  if (filters.busyLevel) {
    where.busyLevel = filters.busyLevel;
  }
  if (filters.eventRunning !== null && filters.eventRunning !== undefined) {
    where.eventRunning = filters.eventRunning;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { reportDate: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        createdBy: { select: { name: true, role: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports,
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}
