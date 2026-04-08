import { prisma } from "./prisma";

const SETTINGS_ID = "singleton";

export interface SiteSettings {
  id: string;
  siteName: string;
  defaultEmail: string | null;
  logoUrl: string | null;
}

export async function getSettings(): Promise<SiteSettings> {
  const existing = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (existing) return existing;

  // Auto-create default settings on first access
  return prisma.settings.create({
    data: {
      id: SETTINGS_ID,
      siteName: "Giuseppe's Restaurant",
      defaultEmail: null,
      logoUrl: null,
    },
  });
}

export async function updateSettings(
  data: Partial<{ siteName: string; defaultEmail: string | null; logoUrl: string | null }>
): Promise<SiteSettings> {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: {
      id: SETTINGS_ID,
      siteName: data.siteName ?? "Giuseppe's Restaurant",
      defaultEmail: data.defaultEmail ?? null,
      logoUrl: data.logoUrl ?? null,
    },
  });
}
