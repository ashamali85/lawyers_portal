# Adala — Kuwait Legal Directory

A verified directory where lawyers and firms apply to advertise their services,
an administrator approves each application, and the public browses approved
counsel — no account required.

## Stack

- **Next.js 15** (App Router) + **React 19** — server-first, React Server
  Components and Server Actions (no separate API layer except one route for
  resume streaming).
- **TypeScript** (strict).
- **Prisma** + **PostgreSQL** (Neon).
- **Auth**: hand-rolled — `bcryptjs` hashing, `jose` JWT in an httpOnly /
  sameSite-strict cookie carrying only the user id; role is read fresh from the
  DB on every request. `middleware.ts` does a cheap edge signature check.
- **Vercel Blob** for private resume storage.
- **zod** for input validation. Plain `globals.css` — no CSS framework.

## Roles

- **Public** — browse and filter approved lawyers, view profiles and listings.
  No login.
- **Lawyer** — registers (with resume), waits for approval, then posts service
  listings from the dashboard.
- **Admin** — reviews applications, approves/declines with a note, and is the
  only role that can open a resume.

## Local setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, BLOB_READ_WRITE_TOKEN, SEED_ADMIN_*
npx prisma db push        # create tables
npm run db:seed           # create the super admin
npm run dev
```

Open http://localhost:3000. Sign in at `/login` with your seed admin
credentials to reach `/admin`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (queries) |
| `DIRECT_URL` | Neon direct connection string (migrations) |
| `JWT_SECRET` | Session signing key, min 32 chars (`openssl rand -base64 48`) |
| `APP_URL` | Public base URL |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token (resume uploads) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | One-time super admin, used by the seed |

## Deploy (Vercel)

1. Push to GitHub, import into Vercel.
2. Add the env vars above (Production + Preview).
3. Create a Vercel Blob store; its token populates `BLOB_READ_WRITE_TOKEN`.
4. The default build runs `prisma generate && prisma db push && next build`.
   `db push` no longer uses `--accept-data-loss`, so it refuses destructive
   changes instead of applying them silently.
5. **Recommended for production:** switch to versioned migrations. Create an
   initial migration locally with `npx prisma migrate dev --name init`, commit
   the generated `prisma/migrations/` directory, and set the Vercel build
   command to `npm run build:migrate` (which runs `prisma migrate deploy`).
   This gives you a reviewable, reversible schema history.
6. After first deploy, run the seed once (locally against the prod DB, or via a
   one-off script) to create the admin. The seed refuses the example
   placeholder credentials and passwords shorter than 12 characters.

## Privacy notes

- Resumes are never exposed to the client. The `/api/resume/[id]` route checks
  the admin session before streaming the PDF.
- Only `APPROVED` profiles are queryable from public pages; pending/declined
  profiles 404 on the public detail route.
- The session cookie holds only the user id, so revoking or changing a role
  takes effect on the next request.
