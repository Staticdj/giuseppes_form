import nodemailer from "nodemailer";

export interface ReportEmailParams {
  to: string;
  venueName: string;
  reportDate: string;
  enteredBy: string;
  totalTrade: string | null;
  finalizedAt: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

function buildEmailBody(params: ReportEmailParams): string {
  const total = params.totalTrade ? `\nTotal Trade: ${params.totalTrade}` : "";
  return [
    `End of Trade Report — ${params.venueName}`,
    ``,
    `Date: ${params.reportDate}`,
    `Entered By: ${params.enteredBy}`,
    total,
    `Finalised: ${params.finalizedAt}`,
    ``,
    `The full report is attached as a PDF.`,
    ``,
    `This is an automated notification from the End of Trade system.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildEmailHtml(params: ReportEmailParams): string {
  const total = params.totalTrade
    ? `<tr><td style="color:#555;padding:4px 8px;">Total Trade</td><td style="padding:4px 8px;font-weight:bold;">${params.totalTrade}</td></tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1a5c1a;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;">
    <h2 style="margin:0;font-size:18px;">End of Trade Report</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">${params.venueName}</p>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 6px 6px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="color:#555;padding:4px 8px;">Report Date</td><td style="padding:4px 8px;font-weight:bold;">${params.reportDate}</td></tr>
      <tr style="background:#f9f9f9;"><td style="color:#555;padding:4px 8px;">Entered By</td><td style="padding:4px 8px;font-weight:bold;">${params.enteredBy}</td></tr>
      ${total}
      <tr style="background:#f9f9f9;"><td style="color:#555;padding:4px 8px;">Finalised</td><td style="padding:4px 8px;font-weight:bold;">${params.finalizedAt}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#666;">
      The full report is attached as a PDF.
    </p>
  </div>
  <p style="font-size:11px;color:#aaa;margin-top:12px;text-align:center;">
    Automated notification — End of Trade system
  </p>
</body>
</html>`;
}

/**
 * Create a nodemailer transporter from environment variables.
 * Returns null if SMTP_HOST is not configured.
 */
function createTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
        : undefined,
  });
}

/**
 * Send a finalised report email with the PDF attached.
 * Throws if the send fails so the caller can handle/audit the error.
 */
export async function sendReportEmail(params: ReportEmailParams): Promise<void> {
  const transporter = createTransport();

  if (!transporter) {
    throw new Error(
      "SMTP not configured — set SMTP_HOST in environment variables"
    );
  }

  const from =
    process.env.SMTP_FROM ??
    process.env.SMTP_USER ??
    "noreply@example.com";

  await transporter.sendMail({
    from,
    to: params.to,
    subject: `End of Trade Report – ${params.venueName} – ${params.reportDate}`,
    text: buildEmailBody(params),
    html: buildEmailHtml(params),
    attachments: [
      {
        filename: params.pdfFilename,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
