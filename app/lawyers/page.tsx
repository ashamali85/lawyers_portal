import Link from "next/link";
import { prisma } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { initials, TypeBadge } from "@/components/ui";
import { PRACTICE_AREAS, KUWAIT_GOVERNORATES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Search = { area?: string; city?: string; type?: string; q?: string };

export default async function LawyersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const where: Prisma.LawyerProfileWhereInput = { status: "APPROVED" };
  if (sp.area) where.practiceAreas = { has: sp.area };
  if (sp.city) where.city = sp.city;
  if (sp.type === "INDIVIDUAL" || sp.type === "FIRM") where.profileType = sp.type;
  if (sp.q) {
    where.OR = [
      { fullName: { contains: sp.q, mode: "insensitive" } },
      { bio: { contains: sp.q, mode: "insensitive" } },
    ];
  }

  const lawyers = await prisma.lawyerProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      ads: { where: { status: "PUBLISHED" }, select: { id: true } },
    },
  });

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Directory</span>
            <h2 className="mt-0">Browse approved lawyers</h2>
            <p>
              {lawyers.length} listing{lawyers.length === 1 ? "" : "s"} match your
              filters. No account required.
            </p>
          </div>

          <form className="filters" method="get">
            <input
              type="text"
              name="q"
              placeholder="Search by name or keyword"
              defaultValue={sp.q ?? ""}
              style={{ minWidth: 220 }}
            />
            <select name="area" defaultValue={sp.area ?? ""}>
              <option value="">All practice areas</option>
              {PRACTICE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select name="city" defaultValue={sp.city ?? ""}>
              <option value="">All governorates</option>
              {KUWAIT_GOVERNORATES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="type" defaultValue={sp.type ?? ""}>
              <option value="">Any type</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="FIRM">Law firm</option>
            </select>
            <button className="btn btn-primary btn-sm" type="submit">
              Apply
            </button>
            <Link href="/lawyers" className="btn btn-ghost btn-sm">
              Clear
            </Link>
          </form>

          {lawyers.length === 0 ? (
            <div className="empty">
              <h3>No lawyers match yet</h3>
              <p>Try widening your filters or clearing the search.</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {lawyers.map((l) => (
                <Link key={l.id} href={`/lawyers/${l.id}`} className="card lawyer-card">
                  <div className="top">
                    <div className="avatar">{initials(l.fullName)}</div>
                    <div>
                      <h3>{l.fullName}</h3>
                      <div className="meta">
                        {l.city}
                        {l.yearsExperience != null &&
                          ` · ${l.yearsExperience} yr${l.yearsExperience === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>
                  <TypeBadge type={l.profileType} />
                  <div className="chip-row">
                    {l.practiceAreas.slice(0, 3).map((a) => (
                      <span key={a} className="chip">{a}</span>
                    ))}
                    {l.practiceAreas.length > 3 && (
                      <span className="chip plain">+{l.practiceAreas.length - 3}</span>
                    )}
                  </div>
                  <div className="meta">
                    {l.ads.length} published listing{l.ads.length === 1 ? "" : "s"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
