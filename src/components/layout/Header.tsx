"use client";

import { useSession, signOut } from "next-auth/react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface ReportHeaderProps {
  venueName?: string;
  reportDate?: string;
  dayOfWeek?: string;
  status?: "DRAFT" | "FINALIZED";
}

/**
 * Full-page header shown on the report form and detail pages.
 * Shows venue, date, day, status in the centre; nav + user on the sides.
 */
export function ReportHeader({
  venueName,
  reportDate,
  dayOfWeek,
  status,
}: ReportHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo / title */}
        <a href="/reports" className="flex-shrink-0">
          <span className="text-orange-600 font-bold text-xl">Giuseppe's</span>
        </a>

        {/* Centre: Report context */}
        <div className="flex-1 text-center min-w-0">
          {venueName || reportDate ? (
            <>
              <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                {venueName ?? "—"}
              </p>
              <p className="text-gray-500 text-xs leading-tight">
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
            <p className="font-semibold text-gray-800 text-sm">
              End of Trade Report
            </p>
          )}
        </div>

        {/* Right: User + sign out */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {session?.user && (
            <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[120px]">
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

/**
 * Simple app nav bar for the reports list page.
 */
export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-orange-600 font-bold text-xl">Giuseppe's</span>
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="text-sm text-gray-600">
              {session.user.name}{" "}
              <span className="text-xs text-gray-400">
                ({session.user.role})
              </span>
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
