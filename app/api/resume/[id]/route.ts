import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Resumes live in a PRIVATE blob store — the URL is not publicly reachable.
// This route checks the admin session, then fetches the file through the
// authenticated SDK get() and streams it back.
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
    select: { resumePathname: true, resumeName: true },
  });

  if (!profile?.resumePathname) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(profile.resumePathname, { access: "private" });
  if (result?.statusCode !== 200) {
    return new NextResponse("Unavailable", { status: 502 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${profile.resumeName ?? "resume.pdf"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
