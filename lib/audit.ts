import { prisma } from "@/lib/db";

export async function logAction(
  actorId: string,
  action: string,
  target: string,
  detail?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId, action, target, detail },
  });
}
