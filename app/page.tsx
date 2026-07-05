import Link from "next/link";
import { prisma } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { initials, TypeBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [lawyerCount, adCount, areaRows, featured] = await Promise.all([
    prisma.lawyerProfile.count({ where: { status: "APPROVED" } }),
    prisma.serviceAd.count({ where: { status: "PUBLISHED" } }),
    prisma.lawyerProfile.findMany({
      where: { status: "APPROVED" },
      select: { practiceAreas: true },
    }),
    prisma.lawyerProfile.findMany({
      where: { status: "APPROVED", ads: { some: { status: "PUBLISHED" } } },
      take: 3,
      orderBy: { updatedAt: "desc" },
      include: { ads: { where: { status: "PUBLISHED" }, take: 1 } },
    }),
  ]);

  const areaCount = new Set(areaRows.flatMap((r) => r.practiceAreas)).size;

  return (
    <>
      <SiteHeader />

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Kuwait · Verified legal directory</span>
            <h1>Find the right lawyer, with confidence.</h1>
            <p className="lede">
              Every lawyer and firm on Adala is reviewed and approved before
              their listing goes live. Browse freely — no account needed to find
              counsel that fits your case.
            </p>
            <div className="hero-cta">
              <Link href="/lawyers" className="btn btn-primary">
                Browse lawyers
              </Link>
              <Link href="/register" className="btn btn-ghost">
                Join as a lawyer
              </Link>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="n">{lawyerCount}</div>
                <div className="l">Approved lawyers &amp; firms</div>
              </div>
              <div className="stat">
                <div className="n">{adCount}</div>
                <div className="l">Published service listings</div>
              </div>
              <div className="stat">
                <div className="n">{areaCount}</div>
                <div className="l">Practice areas covered</div>
              </div>
            </div>
          </div>

          {/* Signature element: the verification seal */}
          <div className="seal">
            <div className="seal-core">
              <div className="ar">موثّق</div>
              <div className="en">Verified · Adala</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How Adala works</span>
            <h2>Vetted first. Listed second.</h2>
            <p>
              A three-step review keeps the directory trustworthy for the public.
            </p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <span className="eyebrow">Step 01</span>
              <h3>Lawyers apply</h3>
              <p className="muted">
                A lawyer or firm submits their details and a resume for review.
              </p>
            </div>
            <div className="card">
              <span className="eyebrow">Step 02</span>
              <h3>Admin reviews</h3>
              <p className="muted">
                Our team checks each application and approves or declines it.
              </p>
            </div>
            <div className="card">
              <span className="eyebrow">Step 03</span>
              <h3>Listings go live</h3>
              <p className="muted">
                Approved lawyers post service listings the public can browse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="spread" style={{ marginBottom: 28 }}>
              <div>
                <span className="eyebrow">Recently listed</span>
                <h2 className="mt-0">Newest approved counsel</h2>
              </div>
              <Link href="/lawyers" className="btn btn-ghost btn-sm">
                See all
              </Link>
            </div>
            <div className="grid grid-3">
              {featured.map((l) => (
                <Link key={l.id} href={`/lawyers/${l.id}`} className="card lawyer-card">
                  <div className="top">
                    <div className="avatar">{initials(l.fullName)}</div>
                    <div>
                      <h3>{l.fullName}</h3>
                      <div className="meta">{l.city}</div>
                    </div>
                  </div>
                  <TypeBadge type={l.profileType} />
                  <div className="chip-row">
                    {l.practiceAreas.slice(0, 3).map((a) => (
                      <span key={a} className="chip">{a}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </>
  );
}
