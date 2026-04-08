import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canBackdate } from "@/lib/roles";
import { ReportFormWizard } from "@/components/report-form/ReportFormWizard";

export default async function NewReportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userCanBackdate = canBackdate(session.user.role);

  const initialData = {
    enteredBy: session.user.name ?? "",
  };

  return (
    <ReportFormWizard
      canBackdate={userCanBackdate}
      initialData={initialData}
    />
  );
}
