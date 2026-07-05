import type { ApplicationStatus, ProfileType } from "@prisma/client";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map = {
    PENDING: { cls: "pending", label: "Pending review" },
    APPROVED: { cls: "approved", label: "Approved" },
    REJECTED: { cls: "rejected", label: "Not approved" },
  } as const;
  const s = map[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function TypeBadge({ type }: { type: ProfileType }) {
  return (
    <span className="badge firm">
      {type === "FIRM" ? "Law firm" : "Individual"}
    </span>
  );
}
