# Target

A strategy execution hub built on the **Scaling Up** framework. Directors log the initiatives they're
driving, break them into milestones, attach evidence and comment on each other's work. Progress rolls up
from milestones all the way to the North Star (the BHAG).

```
Core Purpose + Core Values           (the foundation, edited by admins)
North Star (BHAG)                    10–25 years
 └─ 3–5 Year Goals
     └─ Annual Goals                 one can be the #1 Priority of the year
         └─ Quarterly Rocks          one can be the #1 Priority of the quarter
             └─ Initiatives          owned by a director
                 └─ Milestones       each completed milestone = an equal share of the initiative
```

## How progress is calculated

- **Initiative** = completed milestones ÷ total milestones (3 milestones → 33.3% each).
- **Rock** = average of its initiatives.
- **Annual Goal / 3–5 Year Goal / North Star** = average of the level directly below.
- Anything with nothing under it yet counts as 0%, so an empty Rock pulls its Annual Goal down instead of being hidden.

## Who can do what

| | Admin | Director |
|---|---|---|
| View everything, comment on any initiative | ✓ | ✓ |
| Create initiatives (they become the owner) | ✓ | ✓ |
| Edit an initiative, its milestones and evidence | any | own only |
| Add/edit North Star, 3–5 Year Goals, Annual Goals, Rocks, Purpose & Values | ✓ | |
| Manage users (create, roles, deactivate, reset passwords) | ✓ | |

## Sign-in

- **Email and password.** An admin creates the account with any email address and a temporary password.
  The person must choose their own password at first sign-in.
- **Google (optional).** When configured, a Google account whose email matches an existing user signs into
  that user. If `GOOGLE_ALLOWED_DOMAIN` is set, anyone with an email on that domain can sign in and gets a
  Director account automatically.

## Deploying on Vercel

1. **Import the repo.** Vercel → Add New → Project → import `target-platform`. Keep the defaults
   (Framework: Next.js, Root Directory: `./`).
2. **Add the database.** Project → Storage → Create Database → **Neon**. Connect it to this project for all
   environments. This sets `DATABASE_URL`.
3. **Add file storage.** Project → Storage → Create → **Blob**. Connect it to this project. This sets
   `BLOB_READ_WRITE_TOKEN`.
4. **Create the first admin.** Project → Settings → Environment Variables:
   - `ADMIN_EMAIL`: your email
   - `ADMIN_PASSWORD`: a temporary password (10+ characters); you'll change it at first sign-in
   - `ADMIN_NAME`: your name
5. **Redeploy** (Deployments → ⋯ → Redeploy). Every build applies database migrations first, and creates the
   admin account if the database has no users yet.

Every push to `main` deploys to production. Pushes to any other branch get their own preview URL.

> **Preview deployments and the database.** Migrations run on every build, including previews. In the Neon
> integration settings, turn on a separate database branch for Preview deployments so previews never touch
> production data.

### Optional: Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials, create an
   **OAuth client ID** (type: Web application).
2. Add the authorized redirect URI `https://<your-production-domain>/auth/google/callback`.
3. In Vercel, add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `APP_URL` (`https://<your-production-domain>`).
   Optionally add `GOOGLE_ALLOWED_DOMAIN` (e.g. `yourcompany.com`).
4. Redeploy. A "Continue with Google" button appears on the sign-in page.

### Files

Uploads are limited to 4 MB each (a Vercel limit on request size). For larger files, add a Drive/Dropbox link
as evidence instead. Files are only ever served through `/files/<id>`, which requires a signed-in user.

## Local development

Requires Node 22+ and PostgreSQL.

```bash
cp .env.example .env      # then fill in DATABASE_URL and the ADMIN_* values
npm install
npm run db:migrate        # creates tables and the first admin
npm run dev               # http://localhost:3000
```

Without `BLOB_READ_WRITE_TOKEN`, uploads are saved to `./.uploads`.

### Changing the database schema

Edit `src/db/schema.ts`, then run `npm run db:generate` to create a migration in `drizzle/`. Commit it;
the next deploy applies it.

## Stack

Next.js 16 (App Router, server actions) · TypeScript · PostgreSQL via Drizzle ORM · Tailwind CSS 4 ·
Vercel Blob · Google OAuth via Arctic. Passwords are hashed with scrypt; sessions are random tokens stored
hashed in the database, in an HTTP-only cookie.
