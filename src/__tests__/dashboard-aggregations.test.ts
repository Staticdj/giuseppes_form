/**
 * Integration tests for dashboard aggregation functions.
 * Uses the real SQLite test DB via Prisma.
 */

import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
});

jest.mock("@/lib/prisma", () => ({
  prisma: new (require("@prisma/client").PrismaClient)({
    datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
  }),
}));

import {
  getDailyResult,
  getWeeklyResult,
  getMonthlyResult,
  getComplianceData,
  getFilteredReports,
  startOfDay,
  startOfWeek,
  addDays,
} from "@/lib/dashboard/aggregations";

// ── Helpers ──────────────────────────────────────────────────────────────────

let testUserId: string;

async function ensureUser() {
  if (testUserId) return testUserId;
  const u = await prisma.user.create({
    data: {
      name: "Dashboard Test User",
      email: `dash-${Date.now()}@test.com`,
      password: await bcrypt.hash("x", 4),
      role: Role.MANAGER,
    },
  });
  testUserId = u.id;
  return testUserId;
}

async function createReport(
  date: Date,
  overrides: Partial<{
    cash: number;
    eftpos: number;
    vouchers: number;
    hotelChargeback: number;
    online: number;
    phone: number;
    dineIn: number;
    takeaway: number;
    deliveries: number;
    voids: number;
    status: ReportStatus;
    busyLevel: string;
    eventRunning: boolean;
    eventName: string;
    weatherCondition: string;
    notes: string;
    enteredBy: string;
  }> = {}
) {
  const userId = await ensureUser();
  const day = startOfDay(date);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return prisma.report.create({
    data: {
      venueName: "Test Venue",
      reportDate: day,
      dayOfWeek: days[day.getDay()],
      enteredBy: overrides.enteredBy ?? "Test User",
      status: overrides.status ?? ReportStatus.FINALIZED,
      isBackdated: false,
      createdById: userId,
      cash: overrides.cash ?? 500,
      eftpos: overrides.eftpos ?? 800,
      vouchers: overrides.vouchers ?? 0,
      hotelChargeback: overrides.hotelChargeback ?? 0,
      online: overrides.online ?? 200,
      phone: overrides.phone ?? 100,
      dineIn: overrides.dineIn ?? 600,
      takeaway: overrides.takeaway ?? 300,
      deliveries: overrides.deliveries ?? 0,
      voids: overrides.voids ?? 0,
      busyLevel: overrides.busyLevel ?? null,
      eventRunning: overrides.eventRunning ?? false,
      eventName: overrides.eventName ?? null,
      weatherCondition: overrides.weatherCondition ?? null,
      notes: overrides.notes ?? null,
      signedOff: true,
      signedOffBy: "Tester",
      finalizedAt: overrides.status === ReportStatus.FINALIZED ? new Date() : null,
    },
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.$connect();
  await ensureUser();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Daily aggregation ─────────────────────────────────────────────────────────

describe("getDailyResult", () => {
  it("returns hasReport: false for a date with no report", async () => {
    const farFuture = new Date(2099, 0, 15);
    const result = await getDailyResult(farFuture);
    expect(result.hasReport).toBe(false);
    expect(result.report).toBeNull();
  });

  it("returns report data when a report exists for that date", async () => {
    const date = new Date(2099, 1, 10);
    await createReport(date, { cash: 600, eftpos: 900 });
    const result = await getDailyResult(date);
    expect(result.hasReport).toBe(true);
    expect(result.report).not.toBeNull();
    expect(result.report!.cash).toBe(600);
    expect(result.report!.eftpos).toBe(900);
  });

  it("computes totalTrade correctly", async () => {
    const date = new Date(2099, 1, 11);
    await createReport(date, {
      cash: 100,
      eftpos: 200,
      vouchers: 50,
      hotelChargeback: 25,
    });
    const result = await getDailyResult(date);
    expect(result.report!.totalTrade).toBe(375);
  });

  it("computes salesChannelTotal correctly", async () => {
    const date = new Date(2099, 1, 12);
    await createReport(date, {
      online: 100,
      phone: 50,
      dineIn: 300,
      takeaway: 150,
      deliveries: 25,
    });
    const result = await getDailyResult(date);
    expect(result.report!.salesChannelTotal).toBe(625);
  });
});

// ── Weekly aggregation ────────────────────────────────────────────────────────

describe("getWeeklyResult", () => {
  it("returns empty week when no reports exist", async () => {
    const farWeek = startOfWeek(new Date(2098, 5, 10));
    const result = await getWeeklyResult(farWeek);
    expect(result.totalTrade).toBe(0);
    expect(result.finalisedCount).toBe(0);
    expect(result.days).toHaveLength(7);
    expect(result.days.every((d) => !d.hasReport)).toBe(true);
  });

  it("aggregates totalTrade across reports in the week", async () => {
    const weekStart = startOfWeek(new Date(2099, 3, 7));
    await createReport(addDays(weekStart, 0), { cash: 500, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 1), { cash: 300, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    expect(result.totalTrade).toBe(800);
  });

  it("calculates avgDailyTrade from days with reports only", async () => {
    const weekStart = startOfWeek(new Date(2099, 4, 5));
    await createReport(addDays(weekStart, 0), { cash: 600, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 2), { cash: 400, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    // 2 days with reports → avg = 1000 / 2
    expect(result.avgDailyTrade).toBe(500);
  });

  it("identifies the best day", async () => {
    const weekStart = startOfWeek(new Date(2099, 5, 2));
    await createReport(addDays(weekStart, 0), { cash: 200, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 1), { cash: 900, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 2), { cash: 400, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    expect(result.bestDay).not.toBeNull();
    expect(result.bestDay!.total).toBe(900);
  });

  it("counts finalisedCount and draftCount", async () => {
    const weekStart = startOfWeek(new Date(2099, 6, 7));
    await createReport(addDays(weekStart, 0), { status: ReportStatus.FINALIZED, cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 1), { status: ReportStatus.DRAFT, cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    expect(result.finalisedCount).toBe(1);
    expect(result.draftCount).toBe(1);
  });

  it("aggregates weather tags from reports", async () => {
    const weekStart = startOfWeek(new Date(2099, 7, 4));
    await createReport(addDays(weekStart, 0), { weatherCondition: "RAIN", cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 1), { weatherCondition: "FINE", cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    expect(result.weatherTags).toContain("RAIN");
    expect(result.weatherTags).toContain("FINE");
    expect(result.weatherTags).toHaveLength(2);
  });

  it("counts event days", async () => {
    const weekStart = startOfWeek(new Date(2099, 8, 1));
    await createReport(addDays(weekStart, 0), { eventRunning: true, eventName: "Party", cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(addDays(weekStart, 1), { eventRunning: false, cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getWeeklyResult(weekStart);
    expect(result.eventDays).toBe(1);
  });
});

// ── Monthly aggregation ───────────────────────────────────────────────────────

describe("getMonthlyResult", () => {
  const YEAR = 2097;
  const MONTH = 8; // August

  it("returns zero totals for a month with no reports", async () => {
    const result = await getMonthlyResult(2096, 3);
    expect(result.totalTrade).toBe(0);
    expect(result.totalReports).toBe(0);
    expect(result.finalisedCount).toBe(0);
  });

  it("aggregates totalTrade for the month", async () => {
    await createReport(new Date(YEAR, MONTH - 1, 5), { cash: 1000, eftpos: 0, vouchers: 0, hotelChargeback: 0 });
    await createReport(new Date(YEAR, MONTH - 1, 12), { cash: 800, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getMonthlyResult(YEAR, MONTH);
    expect(result.totalTrade).toBeGreaterThanOrEqual(1800);
  });

  it("identifies the best day in the month", async () => {
    await createReport(new Date(YEAR, MONTH - 1, 20), { cash: 2000, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getMonthlyResult(YEAR, MONTH);
    expect(result.bestDay).not.toBeNull();
    expect(result.bestDay!.total).toBeGreaterThanOrEqual(2000);
  });

  it("groups reports into weekly totals", async () => {
    const result = await getMonthlyResult(YEAR, MONTH);
    expect(result.weeklyTotals.length).toBeGreaterThan(0);
    result.weeklyTotals.forEach((w) => {
      expect(w.total).toBeGreaterThanOrEqual(0);
      expect(w.weekStart).toBeInstanceOf(Date);
    });
  });

  it("identifies the best week", async () => {
    const result = await getMonthlyResult(YEAR, MONTH);
    if (result.weeklyTotals.length > 1) {
      expect(result.bestWeek).not.toBeNull();
    }
  });

  it("calculates finalisedCount and completionRate", async () => {
    const result = await getMonthlyResult(YEAR, MONTH);
    expect(result.finalisedCount).toBeGreaterThan(0);
    expect(result.completionRate).toBeGreaterThanOrEqual(0);
    expect(result.completionRate).toBeLessThanOrEqual(100);
  });
});

// ── Filtered reports ──────────────────────────────────────────────────────────

describe("getFilteredReports", () => {
  it("returns all reports when no filters given", async () => {
    const result = await getFilteredReports({});
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.reports).toBeInstanceOf(Array);
  });

  it("filters by FINALIZED status", async () => {
    const date = new Date(2099, 9, 5);
    await createReport(date, { status: ReportStatus.FINALIZED, cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getFilteredReports({ status: "FINALIZED" });
    expect(result.reports.every((r) => r.status === "FINALIZED")).toBe(true);
  });

  it("filters by DRAFT status", async () => {
    const date = new Date(2099, 9, 6);
    await createReport(date, { status: ReportStatus.DRAFT, cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getFilteredReports({ status: "DRAFT" });
    expect(result.reports.every((r) => r.status === "DRAFT")).toBe(true);
  });

  it("filters by enteredBy (partial match)", async () => {
    const date = new Date(2099, 9, 7);
    await createReport(date, {
      enteredBy: "UniqueNameXYZ",
      cash: 100,
      eftpos: 0,
      vouchers: 0,
      hotelChargeback: 0,
    });

    const result = await getFilteredReports({ enteredBy: "UniqueNameXYZ" });
    expect(result.reports.length).toBeGreaterThanOrEqual(1);
    expect(result.reports.every((r) => r.enteredBy.includes("UniqueNameXYZ"))).toBe(true);
  });

  it("filters by date range", async () => {
    const targetDate = new Date(2099, 9, 15);
    await createReport(targetDate, { cash: 100, eftpos: 0, vouchers: 0, hotelChargeback: 0 });

    const result = await getFilteredReports({
      from: new Date(2099, 9, 14),
      to: new Date(2099, 9, 16),
    });
    const dates = result.reports.map((r) => new Date(r.reportDate).getTime());
    const start = new Date(2099, 9, 14).getTime();
    const end = new Date(2099, 9, 17).getTime();
    dates.forEach((d) => {
      expect(d).toBeGreaterThanOrEqual(start);
      expect(d).toBeLessThan(end);
    });
  });

  it("filters by busyLevel", async () => {
    const date = new Date(2099, 9, 20);
    await createReport(date, {
      busyLevel: "VERY_BUSY",
      cash: 100,
      eftpos: 0,
      vouchers: 0,
      hotelChargeback: 0,
    });

    const result = await getFilteredReports({ busyLevel: "VERY_BUSY" });
    expect(result.reports.length).toBeGreaterThanOrEqual(1);
    expect(result.reports.every((r) => r.busyLevel === "VERY_BUSY")).toBe(true);
  });

  it("filters by eventRunning", async () => {
    const date = new Date(2099, 9, 22);
    await createReport(date, {
      eventRunning: true,
      eventName: "FilterTest",
      cash: 100,
      eftpos: 0,
      vouchers: 0,
      hotelChargeback: 0,
    });

    const result = await getFilteredReports({ eventRunning: true });
    expect(result.reports.length).toBeGreaterThanOrEqual(1);
    expect(result.reports.every((r) => r.eventRunning === true)).toBe(true);
  });

  it("returns empty result for filters with no matches", async () => {
    const result = await getFilteredReports({
      from: new Date(2088, 0, 1),
      to: new Date(2088, 0, 2),
    });
    expect(result.reports).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("aggregation edge cases", () => {
  it("getDailyResult handles zero financial fields", async () => {
    const date = new Date(2099, 10, 1);
    await createReport(date, {
      cash: 0,
      eftpos: 0,
      vouchers: 0,
      hotelChargeback: 0,
      online: 0,
      phone: 0,
      dineIn: 0,
      takeaway: 0,
      deliveries: 0,
    });
    const result = await getDailyResult(date);
    expect(result.hasReport).toBe(true);
    expect(result.report!.totalTrade).toBe(0);
    expect(result.report!.salesChannelTotal).toBe(0);
  });

  it("getWeeklyResult returns 7 day slots regardless of report count", async () => {
    const weekStart = startOfWeek(new Date(2098, 2, 5));
    const result = await getWeeklyResult(weekStart);
    expect(result.days).toHaveLength(7);
  });

  it("getMonthlyResult returns correct monthName", async () => {
    const result = await getMonthlyResult(2024, 6);
    expect(result.monthName).toBe("June");
  });

  it("getMonthlyResult returns correct number of days", async () => {
    // February 2028 (leap year) = 29 days
    const result = await getMonthlyResult(2028, 2);
    expect(result.days).toHaveLength(29);
  });
});
