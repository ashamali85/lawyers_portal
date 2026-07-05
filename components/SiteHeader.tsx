import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          <Image
            src="/logo-mark.webp"
            alt="Adala"
            width={38}
            height={38}
            className="brand-mark-img"
          />
          <span className="brand-name">
            Adala<span>.</span>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/lawyers">Browse lawyers</Link>
          {!user && (
            <>
              <Link href="/register" className="hide-sm">
                Join as a lawyer
              </Link>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
            </>
          )}
          {user?.role === "LAWYER" && <Link href="/dashboard">Dashboard</Link>}
          {user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {user && (
            <form action={logout}>
              <button className="btn btn-ghost btn-sm" type="submit">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
