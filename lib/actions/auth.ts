"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { PRACTICE_AREAS, KUWAIT_GOVERNORATES, LANGUAGES } from "@/lib/constants";

type FormState = { error?: string; ok?: boolean };

const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  profileType: z.enum(["INDIVIDUAL", "FIRM"]),
  fullName: z.string().min(2, "Name is required"),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  phone: z.string().min(6, "Phone number is required"),
  city: z.enum(KUWAIT_GOVERNORATES),
  bio: z.string().min(20, "Tell clients a bit more — at least 20 characters"),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  practiceAreas: z.array(z.enum(PRACTICE_AREAS)).min(1, "Pick at least one practice area"),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Pick at least one language"),
});

export async function registerLawyer(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    profileType: formData.get("profileType"),
    fullName: formData.get("fullName"),
    gender: formData.get("gender") || undefined,
    phone: formData.get("phone"),
    city: formData.get("city"),
    bio: formData.get("bio"),
    yearsExperience: formData.get("yearsExperience") || undefined,
    practiceAreas: formData.getAll("practiceAreas"),
    languages: formData.getAll("languages"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  // Resume upload — required PDF, stored privately in Vercel Blob.
  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return { error: "A resume PDF is required" };
  }
  if (resume.type !== "application/pdf") {
    return { error: "Resume must be a PDF file" };
  }
  if (resume.size > 10 * 1024 * 1024) {
    return { error: "Resume must be under 10 MB" };
  }

  let resumeBlobUrl: string;
  try {
    const blob = await put(`resumes/${Date.now()}-${resume.name}`, resume, {
      access: "public", // URL is unguessable; app gates access via the resume route
      addRandomSuffix: true,
    });
    resumeBlobUrl = blob.url;
  } catch {
    return { error: "Could not upload the resume. Please try again." };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "LAWYER",
      lawyerProfile: {
        create: {
          profileType: data.profileType,
          fullName: data.fullName,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          city: data.city,
          bio: data.bio,
          yearsExperience: data.yearsExperience,
          practiceAreas: data.practiceAreas,
          languages: data.languages,
          resumeBlobUrl,
          resumeName: resume.name,
          status: "PENDING",
        },
      },
    },
  });

  await logAction(user.id, "PROFILE_SUBMITTED", user.id, data.fullName);
  await createSession(user.id);
  redirect("/dashboard?submitted=1");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
