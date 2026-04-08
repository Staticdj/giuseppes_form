import { AuditAction, ReportStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { generateReportPdf } from "@/lib/pdf/generate-report-pdf";
import { storePdf } from "@/lib/pdf/pdf-storage";
import { sendReportEmail } from "@/lib/email/send-report-email";

export interface OrchestrationResult {
  success: true;
  reportId: string;
  pdfGenerated: boolean;
  emailSent: boolean;
  /** Non-fatal issues (PDF/email failures). Report is still FINALIZED. */
  warnings: string[];
}

export interface OrchestrationFailure {
  success: false;
  error: string;
}

export type OrchestrationOutcome = OrchestrationResult | OrchestrationFailure;

function fmtMoney(v: Decimal | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(v.toString());
  return isNaN(n) ? null : `$${n.toFixed(2)}`;
}

function sumMoney(...vals: (Decimal | null | undefined)[]): string | null {
  const sum = vals.reduce<number>(
    (acc, v) => acc + (v ? parseFloat(v.toString()) || 0 : 0),
    0
  );
  return sum > 0 ? `$${sum.toFixed(2)}` : null;
}

/**
 * Orchestrates the full finalisation sequence:
 *
 * 1. Validate report is eligible
 * 2. Update status → FINALIZED (committed before PDF/email so failures are non-blocking)
 * 3. Generate PDF from persisted report data
 * 4. Persist PDF metadata
 * 5. Send email to default recipient
 * 6. Record audit events at every step
 * 7. Return outcome with warnings for non-fatal failures
 *
 * Decision: finalisation state is committed even if PDF or email fails.
 * Failures are audited and surfaced as warnings so operators can act.
 */
export async function orchestrateFinalization(
  reportId: string,
  signedOffBy: string,
  userId: string,
  userName: string
): Promise<OrchestrationOutcome> {
  // ── 1. Validate ─────────────────────────────────────────────────────────────
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  if (!report) {
    return { success: false, error: "Report not found" };
  }
  if (report.status === ReportStatus.FINALIZED) {
    return { success: false, error: "Report is already finalised" };
  }
  if (!signedOffBy.trim()) {
    return { success: false, error: "Sign-off name is required" };
  }

  // ── 2. Update report status ──────────────────────────────────────────────────
  const finalizedAt = new Date();
  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.FINALIZED,
      finalizedAt,
      signedOff: true,
      signedOffBy: signedOffBy.trim(),
      signedOffAt: report.signedOffAt ?? finalizedAt,
    },
  });

  await createAuditEvent({
    action: AuditAction.REPORT_FINALIZED,
    userId,
    reportId,
    details: `Finalised by ${userName}`,
  });

  const warnings: string[] = [];
  const settings = await getSettings();

  // ── 3. Generate PDF ──────────────────────────────────────────────────────────
  let pdfBuffer: Buffer | null = null;
  let storageKey: string | null = null;
  let pdfGenerated = false;

  try {
    pdfBuffer = await generateReportPdf(
      {
        venueName: updatedReport.venueName,
        reportDate: updatedReport.reportDate,
        dayOfWeek: updatedReport.dayOfWeek,
        enteredBy: updatedReport.enteredBy,
        status: updatedReport.status,
        cash: updatedReport.cash,
        eftpos: updatedReport.eftpos,
        vouchers: updatedReport.vouchers,
        hotelChargeback: updatedReport.hotelChargeback,
        online: updatedReport.online,
        phone: updatedReport.phone,
        dineIn: updatedReport.dineIn,
        takeaway: updatedReport.takeaway,
        deliveries: updatedReport.deliveries,
        fohJuniors: updatedReport.fohJuniors,
        fohRsa: updatedReport.fohRsa,
        voids: updatedReport.voids,
        notes: updatedReport.notes,
        busyLevel: updatedReport.busyLevel,
        eventRunning: updatedReport.eventRunning,
        eventName: updatedReport.eventName,
        eventType: updatedReport.eventType,
        weatherCondition: updatedReport.weatherCondition,
        weatherImpactNote: updatedReport.weatherImpactNote,
        signedOff: updatedReport.signedOff,
        signedOffBy: updatedReport.signedOffBy,
        signedOffAt: updatedReport.signedOffAt,
        finalizedAt: updatedReport.finalizedAt,
        createdAt: updatedReport.createdAt,
      },
      settings.siteName
    );

    // ── 4. Persist PDF to storage ───────────────────────────────────────────────
    storageKey = await storePdf(pdfBuffer, reportId);
    pdfGenerated = true;

    await prisma.reportPdf.upsert({
      where: { reportId },
      update: { generatedAt: new Date(), storageKey, emailedAt: null },
      create: { reportId, storageKey, recipientEmail: settings.defaultEmail },
    });

    await createAuditEvent({
      action: AuditAction.PDF_GENERATED,
      userId,
      reportId,
      details: `PDF saved as ${storageKey}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`PDF generation failed: ${msg}`);
    await createAuditEvent({
      action: AuditAction.PDF_GENERATION_FAILED,
      userId,
      reportId,
      details: msg,
    });
  }

  // ── 5. Send email ────────────────────────────────────────────────────────────
  let emailSent = false;

  if (!settings.defaultEmail) {
    warnings.push(
      "No default recipient email configured in Settings. Email not sent."
    );
  } else if (!pdfBuffer) {
    warnings.push("Email not sent because PDF generation failed.");
  } else {
    const reportDateStr = updatedReport.reportDate.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const pdfFilename = `EOT-${updatedReport.venueName.replace(/\s+/g, "-")}-${
      updatedReport.reportDate.toISOString().split("T")[0]
    }.pdf`;

    try {
      await sendReportEmail({
        to: settings.defaultEmail,
        venueName: updatedReport.venueName,
        reportDate: reportDateStr,
        enteredBy: updatedReport.enteredBy,
        totalTrade: sumMoney(
          updatedReport.cash,
          updatedReport.eftpos,
          updatedReport.vouchers,
          updatedReport.hotelChargeback
        ),
        finalizedAt: updatedReport.finalizedAt!.toLocaleString("en-AU"),
        pdfBuffer,
        pdfFilename,
      });

      emailSent = true;

      // Record emailed timestamp on PDF record
      if (pdfGenerated) {
        await prisma.reportPdf.update({
          where: { reportId },
          data: {
            emailedAt: new Date(),
            recipientEmail: settings.defaultEmail,
          },
        });
      }

      await createAuditEvent({
        action: AuditAction.EMAIL_SENT,
        userId,
        reportId,
        details: `Report emailed to ${settings.defaultEmail}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`Email failed: ${msg}`);
      await createAuditEvent({
        action: AuditAction.EMAIL_FAILED,
        userId,
        reportId,
        details: `Failed to send to ${settings.defaultEmail}: ${msg}`,
      });
    }
  }

  return {
    success: true,
    reportId,
    pdfGenerated,
    emailSent,
    warnings,
  };
}
