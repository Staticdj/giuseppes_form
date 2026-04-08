/**
 * Tests for email delivery service.
 * Mocks nodemailer to avoid real SMTP connections.
 */

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({
  createTransport: mockCreateTransport,
}));

import { sendReportEmail } from "@/lib/email/send-report-email";
import type { ReportEmailParams } from "@/lib/email/send-report-email";

function makeParams(overrides: Partial<ReportEmailParams> = {}): ReportEmailParams {
  return {
    to: "manager@example.com",
    venueName: "Giuseppe's",
    reportDate: "15 June 2024",
    enteredBy: "Test User",
    totalTrade: "$1,700.00",
    finalizedAt: "15/06/2024, 11:35 pm",
    pdfBuffer: Buffer.from("%PDF-fake"),
    pdfFilename: "EOT-Giuseppes-2024-06-15.pdf",
    ...overrides,
  };
}

describe("sendReportEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "noreply@test.com";
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  it("calls sendMail with correct recipient and subject", async () => {
    mockSendMail.mockResolvedValue({ messageId: "test-123" });

    const params = makeParams();
    await sendReportEmail(params);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.to).toBe("manager@example.com");
    expect(callArg.subject).toContain("Giuseppe's");
    expect(callArg.subject).toContain("15 June 2024");
  });

  it("attaches the PDF with correct filename and content", async () => {
    mockSendMail.mockResolvedValue({});

    const pdfBuffer = Buffer.from("%PDF-test-content");
    await sendReportEmail(makeParams({ pdfBuffer, pdfFilename: "report.pdf" }));

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.attachments).toHaveLength(1);
    expect(callArg.attachments[0].filename).toBe("report.pdf");
    expect(callArg.attachments[0].content).toEqual(pdfBuffer);
    expect(callArg.attachments[0].contentType).toBe("application/pdf");
  });

  it("includes plain text body with report details", async () => {
    mockSendMail.mockResolvedValue({});

    await sendReportEmail(makeParams());

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.text).toContain("Giuseppe's");
    expect(callArg.text).toContain("15 June 2024");
    expect(callArg.text).toContain("Test User");
    expect(callArg.text).toContain("$1,700.00");
  });

  it("includes HTML body", async () => {
    mockSendMail.mockResolvedValue({});
    await sendReportEmail(makeParams());
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.html).toContain("<!DOCTYPE html>");
    expect(callArg.html).toContain("Giuseppe's");
  });

  it("throws when SMTP_HOST is not configured", async () => {
    delete process.env.SMTP_HOST;

    await expect(sendReportEmail(makeParams())).rejects.toThrow(
      "SMTP not configured"
    );
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("propagates sendMail errors", async () => {
    mockSendMail.mockRejectedValue(new Error("Connection refused"));

    await expect(sendReportEmail(makeParams())).rejects.toThrow(
      "Connection refused"
    );
  });

  it("uses SMTP_FROM as sender when set", async () => {
    mockSendMail.mockResolvedValue({});
    process.env.SMTP_FROM = "reports@giuseppe.com";

    await sendReportEmail(makeParams());

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.from).toBe("reports@giuseppe.com");
  });
});
