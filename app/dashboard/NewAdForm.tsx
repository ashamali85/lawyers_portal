"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAd } from "@/lib/actions/ads";
import { PRACTICE_AREAS } from "@/lib/constants";

export default function NewAdForm() {
  const [state, action, pending] = useActionState(createAd, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form action={action} className="form" ref={formRef}>
      {state.error && <div className="alert err">{state.error}</div>}
      {state.ok && <div className="alert ok">Listing published.</div>}

      <div className="field">
        <label htmlFor="title">Listing title</label>
        <input id="title" name="title" type="text" required placeholder="e.g. Family law consultations in Hawalli" />
      </div>

      <div className="two-col">
        <div className="field">
          <label htmlFor="practiceArea">Practice area</label>
          <select id="practiceArea" name="practiceArea" required defaultValue="">
            <option value="" disabled>Select area</option>
            {PRACTICE_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="feeNote">Fee note (optional)</label>
          <input id="feeNote" name="feeNote" type="text" placeholder="e.g. Free first consultation" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="summary">Description</label>
        <textarea id="summary" name="summary" required minLength={20} placeholder="What service do you offer, and who is it for?" />
      </div>

      <button className="btn btn-brass" type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
