import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { StatusBadge, TypeBadge, initials } from "@/components/ui";
import ReviewControls from "./ReviewControls";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const tab = sp.tab ?? "PENDING";
  const statusFilter =
    tab === "APPROVED" ? "APPROVED" : tab === "REJECTED" ? "REJECTED" : "PENDING";

  const [profiles, counts] = await Promise.all([
    prisma.lawyerProfile.findMany({
      where: { status: statusFilter },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { ads: true } } },
    }),
    prisma.lawyerProfile.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  const tabs = [
    { key: "PENDING", label: "Pending", n: countFor("PENDING") },
    { key: "APPROVED", label: "Approved", n: countFor("APPROVED") },
    { key: "REJECTED", label: "Not approved", n: countFor("REJECTED") },
  ];

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container">
          <span className="eyebrow">Administration</span>
          <h1 className="mt-0">Application review</h1>

          <div className="filters" style={{ marginTop: 20 }}>
            {tabs.map((t) => (
              <a
                key={t.key}
                href={`/admin?tab=${t.key}`}
                className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-ghost"}`}
              >
                {t.label} ({t.n})
              </a>
            ))}
          </div>

          {profiles.length === 0 ? (
            <div className="empty">
              <h3>Nothing here</h3>
              <p>No applications with this status.</p>
            </div>
          ) : (
            <div className="stack">
              {profiles.map((p) => (
                <div key={p.id} className="panel">
                  <div className="spread">
                    <div className="row">
                      <div className="avatar">{initials(p.fullName)}</div>
                      <div>
                        <div className="row">
                          <h3 style={{ margin: 0 }}>{p.fullName}</h3>
                          <TypeBadge type={p.profileType} />
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="meta muted">
                          {p.email} · {p.phone} · {p.city}
                          {p.gender && ` · ${p.gender === "MALE" ? "Male" : "Female"}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="chip-row" style={{ marginTop: 16 }}>
                    {p.practiceAreas.map((a) => (
                      <span key={a} className="chip">{a}</span>
                    ))}
                  </div>

                  <p className="muted" style={{ whiteSpace: "pre-line" }}>{p.bio}</p>

                  <div className="row" style={{ margin: "12px 0" }}>
                    {p.resumeBlobUrl && (
                      <a
                        className="btn btn-ghost btn-sm"
                        href={`/api/resume/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View resume ({p.resumeName ?? "PDF"})
                      </a>
                    )}
                    {p.yearsExperience != null && (
                      <span className="muted" style={{ fontSize: 14 }}>
                        {p.yearsExperience} yrs experience
                      </span>
                    )}
                  </div>

                  {p.reviewNote && (
                    <div className="alert info" style={{ fontSize: 14 }}>
                      Previous note: {p.reviewNote}
                    </div>
                  )}

                  <ReviewControls profileId={p.id} status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
