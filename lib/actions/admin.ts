"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const reviewSchema = z.object({
  profileId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(2000).optional(),
});

export async function reviewProfile(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = reviewSchema.safeParse({
    profileId: formData.get("profileId"),
    decision: formData.get("decision"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) throw new Error("Invalid review submission");

  const { profileId, decision, note } = parsed.data;

  const profile = await prisma.lawyerProfile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Profile not found");

  await prisma.lawyerProfile.update({
    where: { id: profileId },
    data: {
      status: decision,
      reviewNote: note,
      reviewedAt: new Date(),
    },
  });

  await logAction(
    admin.id,
    decision === "APPROVED" ? "PROFILE_APPROVED" : "PROFILE_REJECTED",
    profileId,
    note
  );

  revalidatePath("/admin");
}
