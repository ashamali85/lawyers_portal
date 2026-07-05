import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { initials, TypeBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LawyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { id },
    include: {
      ads: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
    },
  });

  // Only approved profiles are publicly visible. Resume is never selected here.
  if (!lawyer || lawyer.status !== "APPROVED") notFound();

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <Link href="/lawyers" className="muted" style={{ fontSize: 14 }}>
            ← Back to directory
          </Link>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="detail-head">
              <div className="avatar">{initials(lawyer.fullName)}</div>
              <div>
                <div className="row" style={{ marginBottom: 6 }}>
                  <TypeBadge type={lawyer.profileType} />
                </div>
                <h1 style={{ margin: "0 0 4px" }}>{lawyer.fullName}</h1>
                <p className="muted mt-0">
                  {lawyer.city}
                  {lawyer.yearsExperience != null &&
                    ` · ${lawyer.yearsExperience} year${lawyer.yearsExperience === 1 ? "" : "s"} of experience`}
                </p>
              </div>
            </div>

            <div className="detail-body">
              <div>
                <h3>About</h3>
                <p className="muted" style={{ whiteSpace: "pre-line" }}>
                  {lawyer.bio}
                </p>

                <h3 style={{ marginTop: 28 }}>Practice areas</h3>
                <div className="chip-row">
                  {lawyer.practiceAreas.map((a) => (
                    <span key={a} className="chip">{a}</span>
                  ))}
                </div>

                <h3 style={{ marginTop: 28 }}>
                  Service listings ({lawyer.ads.length})
                </h3>
                {lawyer.ads.length === 0 ? (
                  <p className="muted">No published listings yet.</p>
                ) : (
                  <div className="stack">
                    {lawyer.ads.map((ad) => (
                      <div key={ad.id} className="card" style={{ padding: 20 }}>
                        <div className="spread">
                          <h4 style={{ margin: 0 }}>{ad.title}</h4>
                          <span className="chip">{ad.practiceArea}</span>
                        </div>
                        <p className="muted" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>
                          {ad.summary}
                        </p>
                        {ad.feeNote && (
                          <p style={{ margin: "10px 0 0", fontWeight: 600, fontSize: 14 }}>
                            {ad.feeNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <aside>
                <div className="card" style={{ position: "sticky", top: 90 }}>
                  <h4 className="mt-0">Contact</h4>
                  <ul className="info-list">
                    <li>
                      <span className="k">Phone</span>
                      <a href={`tel:${lawyer.phone}`}>{lawyer.phone}</a>
                    </li>
                    <li>
                      <span className="k">Email</span>
                      <a href={`mailto:${lawyer.email}`}>{lawyer.email}</a>
                    </li>
                    <li>
                      <span className="k">Governorate</span>
                      <span>{lawyer.city}</span>
                    </li>
                    {lawyer.languages.length > 0 && (
                      <li>
                        <span className="k">Languages</span>
                        <span>{lawyer.languages.join(", ")}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
