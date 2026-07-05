"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireLawyer } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { PRACTICE_AREAS } from "@/lib/constants";

type FormState = { error?: string; ok?: boolean };

const adSchema = z.object({
  title: z.string().min(4, "Give your ad a clear title"),
  summary: z.string().min(20, "Describe the service in at least 20 characters"),
  practiceArea: z.enum(PRACTICE_AREAS),
  feeNote: z.string().max(200).optional(),
});

async function getApprovedProfile(userId: string) {
  const profile = await prisma.lawyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");
  if (profile.status !== "APPROVED") {
    throw new Error("Your profile must be approved before posting ads");
  }
  return profile;
}

export async function createAd(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireLawyer();
  let profile;
  try {
    profile = await getApprovedProfile(user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not allowed" };
  }

  const parsed = adSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    practiceArea: formData.get("practiceArea"),
    feeNote: formData.get("feeNote") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  const ad = await prisma.serviceAd.create({
    data: { lawyerId: profile.id, status: "PUBLISHED", ...parsed.data },
  });

  await logAction(user.id, "AD_PUBLISHED", ad.id, parsed.data.title);
  revalidatePath("/dashboard");
  revalidatePath("/lawyers");
  return { ok: true };
}

export async function setAdStatus(formData: FormData): Promise<void> {
  const user = await requireLawyer();
  const profile = await getApprovedProfile(user.id);

  const adId = String(formData.get("adId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["PUBLISHED", "ARCHIVED"].includes(status)) throw new Error("Invalid status");

  const ad = await prisma.serviceAd.findUnique({ where: { id: adId } });
  if (!ad || ad.lawyerId !== profile.id) throw new Error("Ad not found");

  await prisma.serviceAd.update({
    where: { id: adId },
    data: { status: status as "PUBLISHED" | "ARCHIVED" },
  });

  await logAction(user.id, "AD_STATUS_CHANGED", adId, status);
  revalidatePath("/dashboard");
  revalidatePath("/lawyers");
}
