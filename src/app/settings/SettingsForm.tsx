"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { saveSettings } from "@/actions/settings";

interface SettingsFormProps {
  siteName: string;
  defaultEmail: string | null;
  logoUrl: string | null;
}

export function SettingsForm({ siteName, defaultEmail, logoUrl }: SettingsFormProps) {
  const [siteNameVal, setSiteNameVal] = useState(siteName);
  const [defaultEmailVal, setDefaultEmailVal] = useState(defaultEmail ?? "");
  const [logoUrlVal, setLogoUrlVal] = useState(logoUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveSettings({
        siteName: siteNameVal,
        defaultEmail: defaultEmailVal,
        logoUrl: logoUrlVal,
      });
      if (result.success) {
        setSuccess("Settings saved successfully.");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <FormField label="Site Name" htmlFor="siteName" required>
        <Input
          id="siteName"
          value={siteNameVal}
          onChange={(e) => setSiteNameVal(e.target.value)}
          placeholder="Giuseppe's Restaurant"
          required
        />
      </FormField>

      <FormField
        label="Default Recipient Email"
        htmlFor="defaultEmail"
        hint="Finalised reports will be emailed to this address."
      >
        <Input
          id="defaultEmail"
          type="email"
          value={defaultEmailVal}
          onChange={(e) => setDefaultEmailVal(e.target.value)}
          placeholder="manager@example.com"
        />
      </FormField>

      <FormField
        label="Logo URL"
        htmlFor="logoUrl"
        hint="Optional. Used in PDF headers if provided."
      >
        <Input
          id="logoUrl"
          type="url"
          value={logoUrlVal}
          onChange={(e) => setLogoUrlVal(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </FormField>

      <div className="pt-2">
        <Button type="submit" variant="primary" loading={isPending}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
