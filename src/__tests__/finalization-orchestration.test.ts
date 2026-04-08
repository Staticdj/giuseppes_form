/**
 * Integration tests for the finalisation orchestration service.
 *
 * - Uses a real SQLite test DB via Prisma
 * - Mocks PDF generation and email sending to isolate orchestration logic
 * - Verifies audit events, DB state, and outcome shape for each path
 */

import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ── Prisma test instance ─────────────────────────────────────────────────────
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
});

// ── Module mocks ─────────────────────────────────────────────────────────────
jest.mock("@/lib/prisma", () => ({
  prisma: new (require("@prisma/client").PrismaClient)({
    datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
  }),
}));

const mockGeneratePdf = jest.fn<Promise<Buffer>, [unknown, string?]>();
const mockStorePdf = jest.fn<Promise<string>, [Buffer, string]>();
const mockSendEmail = jest.fn<Promise<void>, [unknown]>();

jest.mock("@/lib/pdf/generate-report-pdf", () => ({
  generateReportPdf: (...args: unknown[]) => mockGeneratePdf(...args as [unknown, string?]),
}));

jest.mock("@/lib/pdf/pdf-storage", () => ({
  storePdf: (...args: unknown[]) => mockStorePdf(...args as [Buffer, string]),
}));

jest.mock("@/lib/email/send-report-email", () => ({
  sendReportEmail: (...args: unknown[]) => mockSendEmail(...args as [unknown]),
}));

import { orchestrateFinalization } from "@/lib/finalization/orchestrate-finalization";

// ── Helpers ──────────────────────────────────────────────────────────────────
async function seedUser(role: Role) {
  return prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `orch-${role.toLowerCase()}-${Date.now()}@test.com`,
      password: await bcrypt.hash("test", 4),
      role,
    },
  });
}

async function seedSettings(defaultEmail: string | null) {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: { defaultEmail },
    create: { id: "singleton", siteName: "Test Venue", defaultEmail },
  });
}

async function createReport(userId: string, date: Date = new Date()) {
  return prisma.report.create({
    data: {
      venueName: "Giuseppe's",
      reportDate: date,
      dayOfWeek: "Monday",
      enteredBy: "Test User",
      status: ReportStatus.DRAFT,
      isBackdated: false,
      createdById: userId,
    },
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
  // Happy-path defaults
  mockGeneratePdf.mockResolvedValue(Buffer.from("%PDF-test"));
  mockStorePdf.mockResolvedValue("report-abc-uuid.pdf");
  mockSendEmail.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("orchestrateFinalization — success path", () => {
  it("returns success with pdfGenerated and emailSent true", async () => {
    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    const result = await orchestrateFinalization(
      report.id,
      "Manager Joe",
      user.id,
      user.name
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.pdfGenerated).toBe(true);
    expect(result.emailSent).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("updates report status to FINALIZED", async () => {
    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const updated = await prisma.report.findUnique({ where: { id: report.id } });
    expect(updated?.status).toBe(ReportStatus.FINALIZED);
    expect(updated?.finalizedAt).not.toBeNull();
    expect(updated?.signedOffBy).toBe("Manager Joe");
    expect(updated?.signedOff).toBe(true);
  });

  it("creates REPORT_FINALIZED, PDF_GENERATED, and EMAIL_SENT audit events", async () => {
    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const logs = await prisma.auditLog.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "asc" },
    });
    const actions = logs.map((l) => l.action);

    expect(actions).toContain("REPORT_FINALIZED");
    expect(actions).toContain("PDF_GENERATED");
    expect(actions).toContain("EMAIL_SENT");
  });

  it("persists ReportPdf metadata with storageKey and emailedAt", async () => {
    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const pdf = await prisma.reportPdf.findUnique({
      where: { reportId: report.id },
    });
    expect(pdf).not.toBeNull();
    expect(pdf?.storageKey).toBe("report-abc-uuid.pdf");
    expect(pdf?.emailedAt).not.toBeNull();
    expect(pdf?.recipientEmail).toBe("recipient@example.com");
  });

  it("calls generateReportPdf with persisted report data", async () => {
    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    expect(mockGeneratePdf).toHaveBeenCalledTimes(1);
    const firstArg = mockGeneratePdf.mock.calls[0][0] as { venueName: string };
    expect(firstArg.venueName).toBe("Giuseppe's");
  });
});

describe("orchestrateFinalization — validation failures", () => {
  it("returns failure when report does not exist", async () => {
    const user = await seedUser(Role.STAFF);
    const result = await orchestrateFinalization(
      "nonexistent-id",
      "Name",
      user.id,
      user.name
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("not found");
  });

  it("returns failure when report is already FINALIZED", async () => {
    const user = await seedUser(Role.MANAGER);
    const report = await createReport(user.id);
    await prisma.report.update({
      where: { id: report.id },
      data: { status: ReportStatus.FINALIZED, finalizedAt: new Date() },
    });

    const result = await orchestrateFinalization(
      report.id,
      "Manager Joe",
      user.id,
      user.name
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("already finalised");
  });

  it("returns failure when signedOffBy is empty", async () => {
    const user = await seedUser(Role.STAFF);
    const report = await createReport(user.id);

    const result = await orchestrateFinalization(
      report.id,
      "   ",
      user.id,
      user.name
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Sign-off name");
  });
});

describe("orchestrateFinalization — missing recipient email", () => {
  it("succeeds but warns and skips email when defaultEmail is null", async () => {
    const user = await seedUser(Role.STAFF);
    await seedSettings(null);
    const report = await createReport(user.id);

    const result = await orchestrateFinalization(
      report.id,
      "Staff Person",
      user.id,
      user.name
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.emailSent).toBe(false);
    expect(result.warnings.some((w) => w.includes("No default recipient email"))).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("still marks report FINALIZED even when email is skipped", async () => {
    const user = await seedUser(Role.STAFF);
    await seedSettings(null);
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Staff Person", user.id, user.name);

    const updated = await prisma.report.findUnique({ where: { id: report.id } });
    expect(updated?.status).toBe(ReportStatus.FINALIZED);
  });
});

describe("orchestrateFinalization — PDF generation failure", () => {
  it("warns about PDF failure, report stays FINALIZED, email skipped", async () => {
    mockGeneratePdf.mockRejectedValue(new Error("Out of memory"));

    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    const result = await orchestrateFinalization(
      report.id,
      "Manager Joe",
      user.id,
      user.name
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.pdfGenerated).toBe(false);
    expect(result.emailSent).toBe(false);
    expect(result.warnings.some((w) => w.includes("PDF generation failed"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("Email not sent because PDF"))).toBe(true);

    const updated = await prisma.report.findUnique({ where: { id: report.id } });
    expect(updated?.status).toBe(ReportStatus.FINALIZED);
  });

  it("creates PDF_GENERATION_FAILED audit event on PDF failure", async () => {
    mockGeneratePdf.mockRejectedValue(new Error("Render error"));

    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const logs = await prisma.auditLog.findMany({
      where: { reportId: report.id, action: "PDF_GENERATION_FAILED" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("orchestrateFinalization — email delivery failure", () => {
  it("warns about email failure, report stays FINALIZED, pdfGenerated true", async () => {
    mockSendEmail.mockRejectedValue(new Error("Connection refused"));

    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    const result = await orchestrateFinalization(
      report.id,
      "Manager Joe",
      user.id,
      user.name
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.pdfGenerated).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.warnings.some((w) => w.includes("Email failed"))).toBe(true);

    const updated = await prisma.report.findUnique({ where: { id: report.id } });
    expect(updated?.status).toBe(ReportStatus.FINALIZED);
  });

  it("creates EMAIL_FAILED audit event on email failure", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP timeout"));

    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const logs = await prisma.auditLog.findMany({
      where: { reportId: report.id, action: "EMAIL_FAILED" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it("does not set emailedAt on ReportPdf when email fails", async () => {
    mockSendEmail.mockRejectedValue(new Error("Refused"));

    const user = await seedUser(Role.MANAGER);
    await seedSettings("recipient@example.com");
    const report = await createReport(user.id);

    await orchestrateFinalization(report.id, "Manager Joe", user.id, user.name);

    const pdf = await prisma.reportPdf.findUnique({ where: { reportId: report.id } });
    expect(pdf?.emailedAt).toBeNull();
  });
});
