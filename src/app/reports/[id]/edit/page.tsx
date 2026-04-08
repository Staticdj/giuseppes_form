import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReport } from "@/actions/report";
import { canBackdate } from "@/lib/roles";
import { ReportFormWizard } from "@/components/report-form/ReportFormWizard";
import { ReportFormData } from "@/components/report-form/FormContext";
import { Decimal } from "@prisma/client/runtime/library";

function decStr(v: Decimal | null | undefined): string {
  if (v === null || v === undefined) return "";
  return v.toString();
}

function intStr(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const report = await getReport(id);
  if (!report) notFound();

  if (report.status === "FINALIZED" && !canBackdate(session.user.role)) {
    redirect(`/reports/${id}`);
  }

  const userCanBackdate = canBackdate(session.user.role);

  const initialData: Partial<ReportFormData> = {
    venueName: report.venueName,
    reportDate: new Date(report.reportDate).toISOString().split("T")[0],
    dayOfWeek: report.dayOfWeek,
    enteredBy: report.enteredBy,
    cash: decStr(report.cash),
    eftpos: decStr(report.eftpos),
    vouchers: decStr(report.vouchers),
    hotelChargeback: decStr(report.hotelChargeback),
    online: decStr(report.online),
    phone: decStr(report.phone),
    dineIn: decStr(report.dineIn),
    takeaway: decStr(report.takeaway),
    deliveries: decStr(report.deliveries),
    fohJuniors: intStr(report.fohJuniors),
    fohRsa: intStr(report.fohRsa),
    voids: decStr(report.voids),
    notes: report.notes ?? "",
    busyLevel: report.busyLevel ?? "",
    eventRunning: report.eventRunning,
    eventName: report.eventName ?? "",
    eventType: report.eventType ?? "",
    weatherCondition: report.weatherCondition ?? "",
    weatherImpactNote: report.weatherImpactNote ?? "",
    signedOff: report.signedOff,
    signedOffBy: report.signedOffBy ?? "",
  };

  return (
    <ReportFormWizard
      reportId={id}
      initialData={initialData}
      canBackdate={userCanBackdate}
      isFinalised={report.status === "FINALIZED"}
    />
  );
}
