import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/layout/Header";
import { SettingsForm } from "./SettingsForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Only admins and managers can access settings
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect("/reports");
  }

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure default email recipient and site details.
            </p>
          </div>
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              ← Reports
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <SettingsForm
            siteName={settings.siteName}
            defaultEmail={settings.defaultEmail}
            logoUrl={settings.logoUrl}
          />
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Email delivery</p>
          <p>
            To enable email delivery, configure <code>SMTP_HOST</code>,{" "}
            <code>SMTP_PORT</code>, <code>SMTP_USER</code>, and{" "}
            <code>SMTP_PASS</code> environment variables. The default recipient
            email above is where finalised reports will be sent.
          </p>
        </div>
      </main>
    </div>
  );
}
