"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { ThemeToggle } from "@/components/providers/ThemeProvider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/reports";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-giuseppe-cream dark:bg-giuseppe-dark flex flex-col items-center justify-center px-4">
      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-600 tracking-tight">Giuseppe&apos;s</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-light">
            Restaurant &amp; Bar · End of Trade
          </p>
          {/* Italian flag accent */}
          <div className="flex justify-center gap-0.5 mt-3">
            <div className="w-6 h-1 rounded-full bg-giuseppe-green" />
            <div className="w-6 h-1 rounded-full bg-white dark:bg-gray-400" />
            <div className="w-6 h-1 rounded-full bg-brand-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-giuseppe-card rounded-xl shadow-sm border border-gray-200 dark:border-giuseppe-border p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-giuseppe-cream mb-6">Sign in</h2>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@giuseppe.com.au"
                required
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>
        </div>

        {/* Dev hint */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">Dev accounts (password: password123)</p>
            <p>admin@giuseppe.com — ADMIN</p>
            <p>manager@giuseppe.com — MANAGER</p>
            <p>staff@giuseppe.com — STAFF</p>
          </div>
        )}
      </div>
    </div>
  );
}
