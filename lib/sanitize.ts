// Small, dependency-free sanitizers for user-supplied filenames.
//
// Two distinct concerns:
//  1. Building a storage path from an uploaded file's name — must not let the
//     user inject path separators or traversal segments.
//  2. Emitting a filename inside a Content-Disposition header — must not let
//     the user inject quotes or CR/LF that would break/split the header.

// Collapse an arbitrary uploaded filename into a safe, flat basename usable
// inside a blob pathname. Strips directory components, control characters, and
// anything that isn't a conservative filename character.
export function safeBlobFilename(name: string): string {
  // Take the basename only — drop any path the client may have supplied.
  const base = name.split(/[/\\]/).pop() ?? "";
  const cleaned = base
    // Replace anything outside a conservative allowlist with a dash.
    .replace(/[^A-Za-z0-9._-]/g, "-")
    // Never allow a leading dot (hidden file) or a run of dots (traversal).
    .replace(/^\.+/, "")
    .replace(/\.{2,}/g, ".")
    // Collapse repeated dashes for tidiness.
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "resume.pdf";
}

// Produce a value safe to place inside a quoted Content-Disposition filename.
// Removes quotes, backslashes, and any control/CR/LF characters that could
// break out of the header or inject a new one. Falls back when empty.
export function safeHeaderFilename(name: string, fallback = "resume.pdf"): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f"\\]/g, "")
    .trim()
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : fallback;
}
