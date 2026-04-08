import { AuditAction } from "@prisma/client";
import { prisma } from "./prisma";

interface CreateAuditEventParams {
  action: AuditAction;
  userId: string;
  reportId?: string;
  details?: string;
}

export async function createAuditEvent({
  action,
  userId,
  reportId,
  details,
}: CreateAuditEventParams) {
  return prisma.auditLog.create({
    data: {
      action,
      userId,
      reportId: reportId ?? null,
      details: details ?? null,
    },
  });
}

export async function getReportAuditLogs(reportId: string) {
  return prisma.auditLog.findMany({
    where: { reportId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
