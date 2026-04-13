"use server";

import { revalidatePath } from "next/cache";
import { AuditAction, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { canBackdate, canReopen } from "@/lib/roles";
import { createAuditEvent } from "@/lib/audit";
import { orchestrateFinalization } from "@/lib/finalization/orchestrate-finalization";
import {
  draftReportSchema,
  finaliseReportSchema,
} from "@/lib/validations/report";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type FinaliseActionResult =
  | {
      success: true;
      data: {
        id: string;
        pdfGenerated: boolean;
        emailSent: boolean;
        warnings: string[];
      };
    }
  | { success: false; error: string };

function toDecimal(v: string | undefined | null) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function toInt(v: string | number | undefined | null) {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function buildReportData(data: Record<string, unknown>, reportDate: Date) {
  return {
    venueName: String(data.venueName ?? ""),
    reportDate,
    dayOfWeek: String(data.dayOfWeek ?? ""),
    enteredBy: String(data.enteredBy ?? ""),

    cash: toDecimal(data.cash as string),
    eftpos: toDecimal(data.eftpos as string),
    vouchers: toDecimal(data.vouchers as string),
    hotelChargeback: toDecimal(data.hotelChargeback as string),

    online: toDecimal(data.online as string),
    phone: toDecimal(data.phone as string),
    dineIn: toDecimal(data.dineIn as string),
    takeaway: toDecimal(data.takeaway as string),
    deliveries: toDecimal(data.deliveries as string),

    fohJuniors: toInt(data.fohJuniors as string),
    fohRsa: toInt(data.fohRsa as string),
    voids: toDecimal(data.voids as string),

    notes: (data.notes as string) || null,

    busyLevel: (data.busyLevel as string) || null,
    eventRunning: Boolean(data.eventRunning),
    eventName: (data.eventName as string) || null,
    eventType: (data.eventType as string) || null,
    weatherCondition: (data.weatherCondition as string) || null,
    weatherImpactNote: (data.weatherImpactNote as string) || null,
  };
}

export async function createDraftReport(
  formData: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const parsed = draftReportSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const d = parsed.data;
  const reportDate = new Date(d.reportDate);
  const now = new Date();
  // Strip time from now for date comparison
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const isBackdated = reportDate < todayMidnight;

  if (isBackdated && !canBackdate(session.user.role)) {
    return { success: false, error: "Only managers and admins can backdate reports" };
  }

  const report = await prisma.report.create({
    data: {
      ...buildReportData(d as unknown as Record<string, unknown>, reportDate),
      status: ReportStatus.DRAFT,
      isBackdated,
      createdById: session.user.id,
    },
  });

  await createAuditEvent({
    action: AuditAction.REPORT_CREATED,
    userId: session.user.id,
    reportId: report.id,
    details: `Draft created for ${d.venueName} on ${d.reportDate}`,
  });

  revalidatePath("/reports");
  return { success: true, data: { id: report.id } };
}

export async function saveDraftReport(
  reportId: string,
  formData: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) return { success: false, error: "Report not found" };
  if (existing.status === ReportStatus.FINALIZED) {
    return { success: false, error: "Cannot edit a finalised report" };
  }

  const parsed = draftReportSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const d = parsed.data;
  const reportDate = new Date(d.reportDate);
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const isBackdated = reportDate < todayMidnight;

  if (isBackdated && !canBackdate(session.user.role)) {
    return { success: false, error: "Only managers and admins can backdate reports" };
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      ...buildReportData(d as unknown as Record<string, unknown>, reportDate),
      isBackdated,
      signedOff: d.signedOff ?? false,
      signedOffBy: d.signedOffBy || null,
    },
  });

  await createAuditEvent({
    action: AuditAction.REPORT_UPDATED,
    userId: session.user.id,
    reportId: report.id,
    details: `Draft updated`,
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return { success: true, data: { id: report.id } };
}

export async function signOffReport(
  reportId: string,
  signedOffBy: string
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) return { success: false, error: "Report not found" };
  if (existing.status === ReportStatus.FINALIZED) {
    return { success: false, error: "Report is already finalised" };
  }

  if (!signedOffBy.trim()) {
    return { success: false, error: "Full name is required for sign-off" };
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      signedOff: true,
      signedOffBy: signedOffBy.trim(),
      signedOffAt: new Date(),
    },
  });

  await createAuditEvent({
    action: AuditAction.REPORT_SIGNED_OFF,
    userId: session.user.id,
    reportId: report.id,
    details: `Signed off by ${signedOffBy.trim()}`,
  });

  revalidatePath(`/reports/${reportId}`);
  return { success: true, data: { id: report.id } };
}

export async function finaliseReport(
  reportId: string,
  formData: Record<string, unknown>
): Promise<FinaliseActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  // Validate sign-off fields from submitted form data
  const parsed = finaliseReportSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const outcome = await orchestrateFinalization(
    reportId,
    parsed.data.signedOffBy,
    session.user.id,
    session.user.name ?? session.user.email ?? "Unknown"
  );

  if (!outcome.success) {
    return { success: false, error: outcome.error };
  }

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");

  return {
    success: true,
    data: {
      id: outcome.reportId,
      pdfGenerated: outcome.pdfGenerated,
      emailSent: outcome.emailSent,
      warnings: outcome.warnings,
    },
  };
}

export async function reopenReport(
  reportId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  if (!canReopen(session.user.role)) {
    return {
      success: false,
      error: "Only managers and admins can reopen finalised reports",
    };
  }

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) return { success: false, error: "Report not found" };
  if (existing.status !== ReportStatus.FINALIZED) {
    return { success: false, error: "Report is not finalised" };
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.DRAFT,
      finalizedAt: null,
    },
  });

  await createAuditEvent({
    action: AuditAction.REPORT_REOPENED,
    userId: session.user.id,
    reportId: report.id,
    details: `Reopened by ${session.user.name}`,
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return { success: true, data: { id: report.id } };
}

export async function getReport(reportId: string) {
  return prisma.report.findUnique({
    where: { id: reportId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      auditLogs: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getReports() {
  return prisma.report.findMany({
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { reportDate: "desc" },
  });
}
