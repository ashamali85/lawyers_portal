import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Resumes are admin-only. Even though the blob URL is unguessable, we never
// hand it to the client — this route checks the session role, then streams
// the file, so access can't leak through the page source.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const profile = await prisma.lawyerProfile.findUnique({
    where: { id },
    select: { resumeBlobUrl: true, resumeName: true },
  });

  if (!profile?.resumeBlobUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const upstream = await fetch(profile.resumeBlobUrl);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Unavailable", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${profile.resumeName ?? "resume.pdf"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
