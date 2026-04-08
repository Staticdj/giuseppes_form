import PDFDocument from "pdfkit";
import type { Decimal } from "@prisma/client/runtime/library";

export interface ReportDataForPdf {
  // Report info
  venueName: string;
  reportDate: Date;
  dayOfWeek: string;
  enteredBy: string;
  status: string;

  // Financial
  cash: Decimal | null;
  eftpos: Decimal | null;
  vouchers: Decimal | null;
  hotelChargeback: Decimal | null;

  // Sales channels
  online: Decimal | null;
  phone: Decimal | null;
  dineIn: Decimal | null;
  takeaway: Decimal | null;
  deliveries: Decimal | null;

  // Staffing
  fohJuniors: number | null;
  fohRsa: number | null;
  voids: Decimal | null;

  // Notes & operations
  notes: string | null;
  busyLevel: string | null;
  eventRunning: boolean;
  eventName: string | null;
  eventType: string | null;
  weatherCondition: string | null;
  weatherImpactNote: string | null;

  // Sign-off
  signedOff: boolean;
  signedOffBy: string | null;
  signedOffAt: Date | null;

  // Timestamps
  finalizedAt: Date | null;
  createdAt: Date;
}

function fmtMoney(v: Decimal | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = parseFloat(v.toString());
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function fmtSum(...vals: (Decimal | null | undefined)[]): string {
  const sum = vals.reduce<number>(
    (acc, v) => acc + (v ? parseFloat(v.toString()) || 0 : 0),
    0
  );
  return sum > 0 ? `$${sum.toFixed(2)}` : "—";
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString("en-AU");
}

const COL_LABEL = 200;
const COL_VALUE = 350;
const PAGE_WIDTH = 595;
const MARGIN = 50;
const ROW_HEIGHT = 18;
const SECTION_HEADER_HEIGHT = 24;

export async function generateReportPdf(
  report: ReportDataForPdf,
  siteName: string = "Giuseppe's Restaurant"
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = PAGE_WIDTH - MARGIN * 2;

    // ── Header ────────────────────────────────────────────────────────────────
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("End of Trade Report", MARGIN, MARGIN, { width: contentWidth });

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#555555")
      .text(siteName, MARGIN, MARGIN + 24, { width: contentWidth });

    // Horizontal rule
    const ruleY = MARGIN + 44;
    doc
      .moveTo(MARGIN, ruleY)
      .lineTo(PAGE_WIDTH - MARGIN, ruleY)
      .strokeColor("#cccccc")
      .lineWidth(1)
      .stroke();

    let y = ruleY + 12;

    // ── Section helper ────────────────────────────────────────────────────────
    function sectionHeader(title: string) {
      // Check if we're near the bottom, add page if needed
      if (y > 730) {
        doc.addPage();
        y = MARGIN;
      }
      doc
        .rect(MARGIN, y, contentWidth, SECTION_HEADER_HEIGHT)
        .fill("#f0f0f0");
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text(title.toUpperCase(), MARGIN + 6, y + 7, {
          width: contentWidth - 12,
        });
      y += SECTION_HEADER_HEIGHT;
    }

    function row(label: string, value: string, shade = false) {
      if (y > 730) {
        doc.addPage();
        y = MARGIN;
      }
      if (shade) {
        doc.rect(MARGIN, y, contentWidth, ROW_HEIGHT).fill("#fafafa");
      }
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(label, MARGIN + 6, y + 4, { width: COL_LABEL - MARGIN - 6 });
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#111111")
        .text(value, COL_LABEL + 10, y + 4, {
          width: COL_VALUE - COL_LABEL - 10,
        });
      // bottom border
      doc
        .moveTo(MARGIN, y + ROW_HEIGHT)
        .lineTo(PAGE_WIDTH - MARGIN, y + ROW_HEIGHT)
        .strokeColor("#eeeeee")
        .lineWidth(0.5)
        .stroke();
      y += ROW_HEIGHT;
    }

    function totalRow(label: string, value: string) {
      if (y > 730) {
        doc.addPage();
        y = MARGIN;
      }
      doc.rect(MARGIN, y, contentWidth, ROW_HEIGHT + 2).fill("#e8f4e8");
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#1a5c1a")
        .text(label, MARGIN + 6, y + 5, { width: COL_LABEL - MARGIN - 6 });
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#1a5c1a")
        .text(value, COL_LABEL + 10, y + 5, {
          width: COL_VALUE - COL_LABEL - 10,
        });
      y += ROW_HEIGHT + 2;
    }

    // ── Report Info ───────────────────────────────────────────────────────────
    sectionHeader("Report Information");
    row("Venue", report.venueName, false);
    row("Report Date", fmtDate(report.reportDate), true);
    row("Day of Week", report.dayOfWeek, false);
    row("Entered By", report.enteredBy, true);
    row("Status", report.status, false);
    if (report.finalizedAt) {
      row("Finalised At", fmtDateTime(report.finalizedAt), true);
    }
    y += 6;

    // ── Financial Totals ──────────────────────────────────────────────────────
    sectionHeader("Financial Totals");
    row("Cash", fmtMoney(report.cash), false);
    row("EFTPOS", fmtMoney(report.eftpos), true);
    row("Vouchers", fmtMoney(report.vouchers), false);
    row("Hotel Chargeback", fmtMoney(report.hotelChargeback), true);
    totalRow(
      "Total Trade",
      fmtSum(report.cash, report.eftpos, report.vouchers, report.hotelChargeback)
    );
    y += 6;

    // ── Sales Channels ────────────────────────────────────────────────────────
    sectionHeader("Sales Channels");
    row("Online", fmtMoney(report.online), false);
    row("Phone", fmtMoney(report.phone), true);
    row("Dine In", fmtMoney(report.dineIn), false);
    row("Takeaway", fmtMoney(report.takeaway), true);
    row("Deliveries", fmtMoney(report.deliveries), false);
    totalRow(
      "Sales Channel Total",
      fmtSum(report.online, report.phone, report.dineIn, report.takeaway, report.deliveries)
    );
    y += 6;

    // ── Staffing ──────────────────────────────────────────────────────────────
    sectionHeader("Staffing");
    row("FOH Juniors", report.fohJuniors !== null ? String(report.fohJuniors) : "—", false);
    row("FOH RSA", report.fohRsa !== null ? String(report.fohRsa) : "—", true);
    row("Voids", fmtMoney(report.voids), false);
    y += 6;

    // ── Operations & Notes ────────────────────────────────────────────────────
    sectionHeader("Operations & Notes");
    row("Busy Level", report.busyLevel ?? "—", false);
    row("Event Running", report.eventRunning ? "Yes" : "No", true);
    if (report.eventRunning) {
      row("Event Name", report.eventName ?? "—", false);
      row("Event Type", report.eventType ?? "—", true);
    }
    row("Weather Condition", report.weatherCondition ?? "—", false);
    row("Weather Impact Note", report.weatherImpactNote ?? "—", true);

    // Notes as multi-line block
    if (report.notes) {
      if (y > 680) {
        doc.addPage();
        y = MARGIN;
      }
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Notes", MARGIN + 6, y + 4, { width: COL_LABEL - MARGIN - 6 });
      const notesText = report.notes;
      const notesHeight = Math.max(
        ROW_HEIGHT,
        doc.heightOfString(notesText, { width: COL_VALUE - COL_LABEL - 10 }) + 8
      );
      doc.rect(MARGIN, y, contentWidth, notesHeight).fill("#fafafa");
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Notes", MARGIN + 6, y + 4, { width: COL_LABEL - MARGIN - 6 });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#111111")
        .text(notesText, COL_LABEL + 10, y + 4, {
          width: COL_VALUE - COL_LABEL - 10,
        });
      doc
        .moveTo(MARGIN, y + notesHeight)
        .lineTo(PAGE_WIDTH - MARGIN, y + notesHeight)
        .strokeColor("#eeeeee")
        .lineWidth(0.5)
        .stroke();
      y += notesHeight;
    }
    y += 6;

    // ── Sign-Off ──────────────────────────────────────────────────────────────
    sectionHeader("Sign-Off");
    row("Signed Off", report.signedOff ? "Yes" : "No", false);
    row("Signed Off By", report.signedOffBy ?? "—", true);
    row(
      "Signed Off At",
      report.signedOffAt ? fmtDateTime(report.signedOffAt) : "—",
      false
    );
    y += 12;

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#aaaaaa")
      .text(
        `Generated ${fmtDateTime(new Date())} — ${siteName}`,
        MARGIN,
        y,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
}
