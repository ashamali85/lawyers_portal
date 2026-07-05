"use client";

import { useState } from "react";
import { reviewProfile } from "@/lib/actions/admin";
import type { ApplicationStatus } from "@prisma/client";

export default function ReviewControls({
  profileId,
  status,
}: {
  profileId: string;
  status: ApplicationStatus;
}) {
  const [open, setOpen] = useState<null | "APPROVED" | "REJECTED">(null);

  if (!open) {
    return (
      <div className="row" style={{ marginTop: 12 }}>
        {status !== "APPROVED" && (
          <button className="btn btn-ok btn-sm" onClick={() => setOpen("APPROVED")}>
            Approve
          </button>
        )}
        {status !== "REJECTED" && (
          <button className="btn btn-danger btn-sm" onClick={() => setOpen("REJECTED")}>
            Decline
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={reviewProfile} className="stack" style={{ marginTop: 12 }}>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="decision" value={open} />
      <div className="field">
        <label htmlFor={`note-${profileId}`}>
          Note {open === "REJECTED" ? "(shown to the applicant)" : "(optional)"}
        </label>
        <textarea
          id={`note-${profileId}`}
          name="note"
          placeholder={
            open === "APPROVED"
              ? "Optional internal note"
              : "Explain what's missing so they can reapply"
          }
        />
      </div>
      <div className="row">
        <button
          className={`btn btn-sm ${open === "APPROVED" ? "btn-ok" : "btn-danger"}`}
          type="submit"
        >
          Confirm {open === "APPROVED" ? "approval" : "decline"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
