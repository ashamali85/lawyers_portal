import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { StatusBadge } from "@/components/ui";
import { setAdStatus } from "@/lib/actions/ads";
import NewAdForm from "./NewAdForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const sp = await searchParams;

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    include: { ads: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) redirect("/register");

  const approved = profile.status === "APPROVED";

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="spread">
            <div>
              <span className="eyebrow">Your dashboard</span>
              <h1 className="mt-0">{profile.fullName}</h1>
            </div>
            <StatusBadge status={profile.status} />
          </div>

          {sp.submitted && (
            <div className="alert ok" style={{ marginTop: 8 }}>
              Application submitted. An administrator will review it shortly.
            </div>
          )}

          {profile.status === "PENDING" && (
            <div className="alert info" style={{ marginTop: 16 }}>
              Your application is under review. You can post service listings
              once it&apos;s approved.
            </div>
          )}

          {profile.status === "REJECTED" && (
            <div className="alert err" style={{ marginTop: 16 }}>
              Your application wasn&apos;t approved.
              {profile.reviewNote && (
                <>
                  {" "}
                  <strong>Reviewer note:</strong> {profile.reviewNote}
                </>
              )}
            </div>
          )}

          {approved && (
            <>
              <div className="panel" style={{ marginTop: 24 }}>
                <h3 className="mt-0">Post a new service listing</h3>
                <p className="muted" style={{ marginTop: 0 }}>
                  Published listings appear on your public profile and in the
                  directory.
                </p>
                <NewAdForm />
              </div>

              <h3 style={{ marginTop: 36 }}>
                Your listings ({profile.ads.length})
              </h3>
              {profile.ads.length === 0 ? (
                <p className="muted">No listings yet. Create your first above.</p>
              ) : (
                <div className="stack">
                  {profile.ads.map((ad) => (
                    <div key={ad.id} className="card" style={{ padding: 20 }}>
                      <div className="spread">
                        <div>
                          <div className="row">
                            <h4 style={{ margin: 0 }}>{ad.title}</h4>
                            <span className="chip">{ad.practiceArea}</span>
                            <span
                              className={`badge ${
                                ad.status === "PUBLISHED" ? "approved" : "pending"
                              }`}
                            >
                              {ad.status === "PUBLISHED" ? "Published" : "Archived"}
                            </span>
                          </div>
                          <p className="muted" style={{ margin: "8px 0 0" }}>
                            {ad.summary}
                          </p>
                        </div>
                      </div>
                      <form action={setAdStatus} style={{ marginTop: 12 }}>
                        <input type="hidden" name="adId" value={ad.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={ad.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"}
                        />
                        <button className="btn btn-ghost btn-sm" type="submit">
                          {ad.status === "PUBLISHED" ? "Archive" : "Publish"}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
                <Link href={`/lawyers/${profile.id}`}>View your public profile →</Link>
              </p>
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
