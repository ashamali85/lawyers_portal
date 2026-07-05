import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <div className="auth-wrap">
        <div className="panel">
          <span className="eyebrow">Adala</span>
          <h1 style={{ fontSize: 28 }}>Sign in</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            For lawyers and administrators.
          </p>
          <LoginForm />
          <p className="muted" style={{ fontSize: 14, marginTop: 20 }}>
            New here?{" "}
            <Link href="/register">Apply as a lawyer or firm</Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
