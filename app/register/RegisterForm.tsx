"use client";

import { useActionState, useState } from "react";
import { registerLawyer } from "@/lib/actions/auth";
import { PRACTICE_AREAS, KUWAIT_GOVERNORATES, LANGUAGES } from "@/lib/constants";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerLawyer, {});
  const [profileType, setProfileType] = useState<"INDIVIDUAL" | "FIRM">(
    "INDIVIDUAL"
  );

  return (
    <form action={action} className="form" encType="multipart/form-data">
      {state.error && <div className="alert err">{state.error}</div>}

      {/* Applicant type */}
      <div className="field">
        <label>I am applying as</label>
        <div className="radio-row">
          <label className="check">
            <input
              type="radio"
              name="profileType"
              value="INDIVIDUAL"
              checked={profileType === "INDIVIDUAL"}
              onChange={() => setProfileType("INDIVIDUAL")}
            />
            Individual lawyer
          </label>
          <label className="check">
            <input
              type="radio"
              name="profileType"
              value="FIRM"
              checked={profileType === "FIRM"}
              onChange={() => setProfileType("FIRM")}
            />
            Law firm
          </label>
        </div>
      </div>

      {/* Account */}
      <div className="two-col">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <span className="hint">At least 8 characters.</span>
        </div>
      </div>

      {/* Identity */}
      <div className="two-col">
        <div className="field">
          <label htmlFor="fullName">
            {profileType === "FIRM" ? "Firm name" : "Full name"}
          </label>
          <input id="fullName" name="fullName" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" type="tel" required placeholder="+965 ..." />
        </div>
      </div>

      <div className="two-col">
        {profileType === "INDIVIDUAL" && (
          <div className="field">
            <label>Gender</label>
            <div className="radio-row">
              <label className="check">
                <input type="radio" name="gender" value="MALE" /> Male
              </label>
              <label className="check">
                <input type="radio" name="gender" value="FEMALE" /> Female
              </label>
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor="city">Governorate</label>
          <select id="city" name="city" required defaultValue="">
            <option value="" disabled>
              Select governorate
            </option>
            {KUWAIT_GOVERNORATES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 220 }}>
        <label htmlFor="yearsExperience">Years of experience</label>
        <input id="yearsExperience" name="yearsExperience" type="number" min={0} max={70} />
      </div>

      {/* Bio */}
      <div className="field">
        <label htmlFor="bio">
          {profileType === "FIRM" ? "About the firm" : "About you"}
        </label>
        <textarea
          id="bio"
          name="bio"
          required
          minLength={20}
          placeholder="Describe your experience, specialties, and how you help clients."
        />
      </div>

      {/* Practice areas */}
      <div className="field">
        <label>Practice areas</label>
        <span className="hint">Select all that apply.</span>
        <div className="check-grid">
          {PRACTICE_AREAS.map((a) => (
            <label key={a} className="check">
              <input type="checkbox" name="practiceAreas" value={a} />
              {a}
            </label>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="field">
        <label>Languages</label>
        <div className="check-grid">
          {LANGUAGES.map((l) => (
            <label key={l} className="check">
              <input type="checkbox" name="languages" value={l} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {/* Resume */}
      <div className="field">
        <label htmlFor="resume">Resume (PDF)</label>
        <input id="resume" name="resume" type="file" accept="application/pdf" required />
        <span className="hint">
          Required for review. PDF up to 10 MB. Visible only to administrators.
        </span>
      </div>

      <button className="btn btn-brass" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit application for review"}
      </button>
    </form>
  );
}
