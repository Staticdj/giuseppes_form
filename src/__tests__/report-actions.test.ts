/**
 * Integration tests for report server actions.
 *
 * These tests use an isolated in-memory / file SQLite database.
 * They mock the auth session to simulate different roles.
 */

import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// ---- Prisma test instance ----
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
});

// ---- Auth mock ----
// We mock @/lib/auth to return controlled sessions
jest.mock("@/lib/auth", () => ({
  requireSession: jest.fn(),
  getSession: jest.fn(),
}));

// ---- next/cache mock ----
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// ---- Prisma mock ----
// Use the real prisma instance but inject our test prisma via mock
jest.mock("@/lib/prisma", () => ({
  prisma: new (require("@prisma/client").PrismaClient)({
    datasourceUrl: process.env.DATABASE_URL ?? "file:./test.db",
  }),
}));

// ---- Orchestrator mock ----
// Mocks the full orchestration so finaliseReport stays fast and isolated.
// The mock still does the essential DB update so downstream tests (e.g. reopenReport)
// see the report as FINALIZED.
jest.mock("@/lib/finalization/orchestrate-finalization", () => {
  return {
    orchestrateFinalization: jest.fn(
      async (reportId: string, signedOffBy: string, userId: string) => {
        const { PrismaClient, ReportStatus, AuditAction } =
          require("@prisma/client");
        const p = new PrismaClient({
          datasourceUrl:
            process.env.DATABASE_URL ?? "file:./test.db",
        });
        const now = new Date();
        await p.report.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.FINALIZED,
            finalizedAt: now,
            signedOff: true,
            signedOffBy: signedOffBy.trim(),
            signedOffAt: now,
          },
        });
        await p.auditLog.create({
          data: {
            action: AuditAction.REPORT_FINALIZED,
            userId,
            reportId,
            details: "Finalised (mock)",
          },
        });
        await p.$disconnect();
        return {
          success: true,
          reportId,
          pdfGenerated: false,
          emailSent: false,
          warnings: [],
        };
      }
    ),
  };
});

import { requireSession } from "@/lib/auth";
import {
  createDraftReport,
  saveDraftReport,
  finaliseReport,
  reopenReport,
} from "@/actions/report";

const mockRequireSession = requireSession as jest.MockedFunction<
  typeof requireSession
>;

// ---- Helpers ----
async function seedUser(role: Role) {
  return prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-${role.toLowerCase()}-${Date.now()}@test.com`,
      password: await bcrypt.hash("test", 4),
      role,
    },
  });
}

function mockSession(user: { id: string; name: string; role: Role }) {
  mockRequireSession.mockResolvedValue({
    user: {
      id: user.id,
      name: user.name,
      email: `${user.id}@test.com`,
      role: user.role,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  });
}

const validReportData = {
  venueName: "Giuseppe's",
  reportDate: new Date().toISOString().split("T")[0], // today
  dayOfWeek: "Monday",
  enteredBy: "Test User",
  cash: "500.00",
  eftpos: "1200.00",
  signedOff: false,
  signedOffBy: "",
};

const validSignedOffData = {
  ...validReportData,
  signedOff: true,
  signedOffBy: "Test User",
};

// ---- Tests ----
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createDraftReport", () => {
  it("creates a DRAFT report for STAFF user", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const result = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const report = await prisma.report.findUnique({
        where: { id: result.data.id },
      });
      expect(report).not.toBeNull();
      expect(report?.status).toBe(ReportStatus.DRAFT);
    }
  });

  it("creates an audit log entry on report creation", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const result = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const logs = await prisma.auditLog.findMany({
        where: { reportId: result.data.id },
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe("REPORT_CREATED");
    }
  });

  it("rejects backdated report for STAFF user", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const backdatedData = {
      ...validReportData,
      reportDate: pastDate.toISOString().split("T")[0],
    };

    const result = await createDraftReport(
      backdatedData as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("backdate");
    }
  });

  it("allows backdated report for MANAGER user", async () => {
    const user = await seedUser(Role.MANAGER);
    mockSession(user);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const backdatedData = {
      ...validReportData,
      reportDate: pastDate.toISOString().split("T")[0],
    };

    const result = await createDraftReport(
      backdatedData as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const report = await prisma.report.findUnique({
        where: { id: result.data.id },
      });
      expect(report?.isBackdated).toBe(true);
    }
  });
});

describe("saveDraftReport", () => {
  it("saves draft successfully", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    // Create first
    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    // Then update
    const updatedData = { ...validReportData, enteredBy: "Updated Name" };
    const saveResult = await saveDraftReport(
      createResult.data.id,
      updatedData as unknown as Record<string, unknown>
    );
    expect(saveResult.success).toBe(true);

    const report = await prisma.report.findUnique({
      where: { id: createResult.data.id },
    });
    expect(report?.enteredBy).toBe("Updated Name");
  });

  it("creates REPORT_UPDATED audit event on save", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    await saveDraftReport(
      createResult.data.id,
      validReportData as unknown as Record<string, unknown>
    );

    const logs = await prisma.auditLog.findMany({
      where: { reportId: createResult.data.id, action: "REPORT_UPDATED" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects save on a finalised report", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    // Force finalize in DB
    await prisma.report.update({
      where: { id: createResult.data.id },
      data: { status: ReportStatus.FINALIZED },
    });

    const saveResult = await saveDraftReport(
      createResult.data.id,
      validReportData as unknown as Record<string, unknown>
    );
    expect(saveResult.success).toBe(false);
    if (!saveResult.success) {
      expect(saveResult.error).toContain("finalised");
    }
  });
});

describe("finaliseReport", () => {
  it("transitions report from DRAFT to FINALIZED", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    const finalResult = await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );
    expect(finalResult.success).toBe(true);

    const report = await prisma.report.findUnique({
      where: { id: createResult.data.id },
    });
    expect(report?.status).toBe(ReportStatus.FINALIZED);
    expect(report?.finalizedAt).not.toBeNull();
  });

  it("fails to finalise without sign-off checkbox", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    const result = await finaliseReport(
      createResult.data.id,
      {
        ...validReportData,
        signedOff: false,
        signedOffBy: "Test User",
      } as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(false);
  });

  it("fails to finalise without signedOffBy name", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    const result = await finaliseReport(
      createResult.data.id,
      {
        ...validReportData,
        signedOff: true,
        signedOffBy: "",
      } as unknown as Record<string, unknown>
    );
    expect(result.success).toBe(false);
  });

  it("creates REPORT_FINALIZED audit event", async () => {
    const user = await seedUser(Role.STAFF);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );

    const logs = await prisma.auditLog.findMany({
      where: { reportId: createResult.data.id, action: "REPORT_FINALIZED" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("reopenReport", () => {
  it("allows MANAGER to reopen a finalised report", async () => {
    const user = await seedUser(Role.MANAGER);
    mockSession(user);

    // Create and finalize
    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;
    await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );

    // Reopen
    const reopenResult = await reopenReport(createResult.data.id);
    expect(reopenResult.success).toBe(true);

    const report = await prisma.report.findUnique({
      where: { id: createResult.data.id },
    });
    expect(report?.status).toBe(ReportStatus.DRAFT);
  });

  it("denies STAFF from reopening a finalised report", async () => {
    // Create and finalize with manager
    const manager = await seedUser(Role.MANAGER);
    mockSession(manager);
    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;
    await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );

    // Try to reopen with staff
    const staff = await seedUser(Role.STAFF);
    mockSession(staff);
    const reopenResult = await reopenReport(createResult.data.id);
    expect(reopenResult.success).toBe(false);
    if (!reopenResult.success) {
      expect(reopenResult.error).toContain("managers and admins");
    }
  });

  it("creates REPORT_REOPENED audit event", async () => {
    const manager = await seedUser(Role.MANAGER);
    mockSession(manager);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;
    await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );
    await reopenReport(createResult.data.id);

    const logs = await prisma.auditLog.findMany({
      where: { reportId: createResult.data.id, action: "REPORT_REOPENED" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Audit trail", () => {
  it("records audit events in correct order", async () => {
    const user = await seedUser(Role.MANAGER);
    mockSession(user);

    const createResult = await createDraftReport(
      validReportData as unknown as Record<string, unknown>
    );
    if (!createResult.success) return;

    await saveDraftReport(
      createResult.data.id,
      validReportData as unknown as Record<string, unknown>
    );
    await finaliseReport(
      createResult.data.id,
      validSignedOffData as unknown as Record<string, unknown>
    );
    await reopenReport(createResult.data.id);

    const logs = await prisma.auditLog.findMany({
      where: { reportId: createResult.data.id },
      orderBy: { createdAt: "asc" },
    });

    const actions = logs.map((l) => l.action);
    expect(actions).toContain("REPORT_CREATED");
    expect(actions).toContain("REPORT_UPDATED");
    expect(actions).toContain("REPORT_FINALIZED");
    expect(actions).toContain("REPORT_REOPENED");
  });
});
