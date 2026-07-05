import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <div className="form-wrap">
        <span className="eyebrow">Apply to join</span>
        <h1>Register as a lawyer or firm</h1>
        <p className="muted">
          Submit your details and resume. An administrator reviews every
          application before your listing becomes public — you&apos;ll see the
          status on your dashboard.
        </p>
        <div className="panel" style={{ marginTop: 24 }}>
          <RegisterForm />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
