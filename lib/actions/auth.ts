"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { rateLimit, rateLimitReset } from "@/lib/rate-limit";
import { safeBlobFilename } from "@/lib/sanitize";
import { PRACTICE_AREAS, KUWAIT_GOVERNORATES, LANGUAGES } from "@/lib/constants";

type FormState = { error?: string; ok?: boolean };

const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  // bcrypt silently ignores bytes past 72, so cap here to avoid a password
  // whose tail is meaningless. 64 chars is a comfortable, unambiguous ceiling.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters"),
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
  let resumePathname: string;
  try {
    const blob = await put(
      `resumes/${Date.now()}-${safeBlobFilename(resume.name)}`,
      resume,
      {
        access: "private", // sensitive vetting doc; only reachable via authenticated get()
        addRandomSuffix: true,
      }
    );
    resumeBlobUrl = blob.url;
    resumePathname = blob.pathname;
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
          resumePathname,
          resumeName: safeBlobFilename(resume.name),
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

// Best-effort client IP from proxy headers. Vercel sets x-forwarded-for.
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Throttle: 5 attempts per 10 minutes per (ip + email).
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password" };

  const ip = await clientIp();
  const rlKey = `login:${ip}:${parsed.data.email.toLowerCase()}`;
  const rl = rateLimit(rlKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rl.allowed) {
    const mins = Math.ceil(rl.retryAfterSeconds / 60);
    return {
      error: `Too many attempts. Try again in about ${mins} minute${
        mins === 1 ? "" : "s"
      }.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
  }

  // Successful auth — clear the counter so earlier typos don't linger.
  rateLimitReset(rlKey);
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
