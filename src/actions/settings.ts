"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { updateSettings } from "@/lib/settings";
import { createAuditEvent } from "@/lib/audit";
import type { ActionResult } from "@/actions/report";

const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  defaultEmail: z
    .string()
    .email("Must be a valid email address")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  logoUrl: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
});

export async function saveSettings(
  formData: Record<string, unknown>
): Promise<ActionResult<{ siteName: string; defaultEmail: string | null }>> {
  const session = await requireSession().catch(() => null);
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const parsed = settingsSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const settings = await updateSettings(parsed.data);

  await createAuditEvent({
    action: AuditAction.SETTINGS_UPDATED,
    userId: session.user.id,
    details: `Settings updated by ${session.user.name}`,
  });

  revalidatePath("/settings");

  return {
    success: true,
    data: { siteName: settings.siteName, defaultEmail: settings.defaultEmail },
  };
}
