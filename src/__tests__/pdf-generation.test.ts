/**
 * Tests for PDF generation service.
 */

import { generateReportPdf } from "@/lib/pdf/generate-report-pdf";
import type { ReportDataForPdf } from "@/lib/pdf/generate-report-pdf";

function makeReport(overrides: Partial<ReportDataForPdf> = {}): ReportDataForPdf {
  return {
    venueName: "Giuseppe's",
    reportDate: new Date("2024-06-15"),
    dayOfWeek: "Saturday",
    enteredBy: "Test User",
    status: "FINALIZED",
    cash: { toString: () => "500.00" } as never,
    eftpos: { toString: () => "1200.00" } as never,
    vouchers: null,
    hotelChargeback: null,
    online: { toString: () => "300.00" } as never,
    phone: { toString: () => "200.00" } as never,
    dineIn: { toString: () => "800.00" } as never,
    takeaway: { toString: () => "400.00" } as never,
    deliveries: null,
    fohJuniors: 3,
    fohRsa: 2,
    voids: { toString: () => "25.00" } as never,
    notes: "Busy Saturday night.",
    busyLevel: "BUSY",
    eventRunning: true,
    eventName: "Birthday Party",
    eventType: "Private Function",
    weatherCondition: "FINE",
    weatherImpactNote: null,
    signedOff: true,
    signedOffBy: "Manager Joe",
    signedOffAt: new Date("2024-06-15T23:30:00"),
    finalizedAt: new Date("2024-06-15T23:35:00"),
    createdAt: new Date("2024-06-15T18:00:00"),
    ...overrides,
  };
}

describe("generateReportPdf", () => {
  it("returns a non-empty Buffer", async () => {
    const report = makeReport();
    const buffer = await generateReportPdf(report, "Giuseppe's Restaurant");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("starts with PDF magic bytes (%PDF-)", async () => {
    const report = makeReport();
    const buffer = await generateReportPdf(report);
    const header = buffer.slice(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("generates without error when most fields are null", async () => {
    const sparse = makeReport({
      cash: null,
      eftpos: null,
      vouchers: null,
      hotelChargeback: null,
      online: null,
      phone: null,
      dineIn: null,
      takeaway: null,
      deliveries: null,
      fohJuniors: null,
      fohRsa: null,
      voids: null,
      notes: null,
      busyLevel: null,
      eventRunning: false,
      eventName: null,
      eventType: null,
      weatherCondition: null,
      weatherImpactNote: null,
      signedOff: false,
      signedOffBy: null,
      signedOffAt: null,
      finalizedAt: null,
    });
    await expect(generateReportPdf(sparse)).resolves.toBeInstanceOf(Buffer);
  });

  it("produces a larger buffer for a fully populated report vs sparse one", async () => {
    const full = makeReport();
    const sparse = makeReport({
      cash: null, eftpos: null, vouchers: null, hotelChargeback: null,
      online: null, phone: null, dineIn: null, takeaway: null, deliveries: null,
      fohJuniors: null, fohRsa: null, voids: null, notes: null,
      busyLevel: null, eventRunning: false, eventName: null, eventType: null,
      weatherCondition: null, weatherImpactNote: null,
      signedOff: false, signedOffBy: null, signedOffAt: null, finalizedAt: null,
    });
    const fullBuf = await generateReportPdf(full);
    const sparseBuf = await generateReportPdf(sparse);
    // A full report has more content — its compressed buffer is still larger
    expect(fullBuf.length).toBeGreaterThan(sparseBuf.length);
  });

  it("produces a valid multi-page or single-page PDF (%%EOF present)", async () => {
    const report = makeReport();
    const buffer = await generateReportPdf(report, "Test Venue Co");
    const tail = buffer.slice(-10).toString("ascii");
    // All valid PDFs end with %%EOF
    expect(buffer.toString("ascii")).toContain("%%EOF");
  });

  it("produces a different buffer for two different venue names", async () => {
    const r1 = makeReport({ venueName: "Venue Alpha" });
    const r2 = makeReport({ venueName: "Venue Beta" });
    const buf1 = await generateReportPdf(r1);
    const buf2 = await generateReportPdf(r2);
    expect(buf1.equals(buf2)).toBe(false);
  });
});
