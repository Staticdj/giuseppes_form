"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/providers/ThemeProvider";

interface ReportHeaderProps {
  venueName?: string;
  reportDate?: string;
  dayOfWeek?: string;
  status?: "DRAFT" | "FINALIZED";
}

export function ReportHeader({
  venueName,
  reportDate,
  dayOfWeek,
  status,
}: ReportHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border shadow-sm sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <a href="/reports" className="flex-shrink-0">
          <span className="text-brand-600 font-bold text-xl tracking-tight">Giuseppe&apos;s</span>
        </a>

        {/* Centre: Report context */}
        <div className="flex-1 text-center min-w-0">
          {venueName || reportDate ? (
            <>
              <p className="font-semibold text-gray-800 dark:text-giuseppe-cream text-sm leading-tight truncate">
                {venueName ?? "—"}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-tight">
                {reportDate ?? "—"}
                {dayOfWeek ? ` · ${dayOfWeek}` : ""}
                {status ? (
                  <span className="ml-2 inline-block">
                    <StatusBadge status={status} />
                  </span>
                ) : null}
              </p>
            </>
          ) : (
            <p className="font-semibold text-gray-800 dark:text-giuseppe-cream text-sm">
              End of Trade Report
            </p>
          )}
        </div>

        {/* Right: Theme toggle + user + sign out */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              {session.user.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppHeader() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isElevated = role === "MANAGER" || role === "ADMIN";

  return (
    <header className="bg-white dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="text-brand-600 font-bold text-xl tracking-tight flex-shrink-0">
            Giuseppe&apos;s
          </Link>
          {isElevated && (
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-giuseppe-border transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-giuseppe-border transition-colors"
              >
                Settings
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
              {session.user.name}{" "}
              <span className="text-xs text-gray-400 dark:text-gray-500">({role})</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
