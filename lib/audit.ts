import { prisma } from "@/lib/db";

// Append to the audit trail. Logging is best-effort: a failure here must never
// roll back or abort the caller's primary mutation, so errors are caught and
// reported rather than thrown. If you need audit writes to be transactional
// with the action, move the create into the same prisma.$transaction instead.
export async function logAction(
  actorId: string,
  action: string,
  target: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, target, detail },
    });
  } catch (err) {
    console.error(
      `Audit log failed: action=${action} target=${target}`,
      err
    );
  }
}
