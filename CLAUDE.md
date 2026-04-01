# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

npm run db:migrate   # Run Prisma migrations (prisma migrate dev)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed DB with default program + test users
```

**Seed credentials (dev only):**
- Admin: `admin@fidelite.fr` / `admin123`
- Client: `client@fidelite.fr` / `client123`

**First-time setup:**
```bash
mysql -u root -p -e "CREATE DATABASE fidelite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cp .env.example .env   # then fill in values
node scripts/migrate-qrtoken.mjs   # apply manual migrations (qrToken, SmtpSettings)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

**Prisma note:** Use `node_modules/.bin/prisma` not global `npx prisma` (version mismatch). For schema changes with existing data, write a raw SQL migration script in `scripts/` rather than using `prisma migrate dev` (non-interactive environment). After any schema change run `db:generate`.

## Architecture

### Route Groups (App Router)
- `(auth)/` — Public login/register pages (no layout wrapper) → URLs: `/login`, `/register`
- `(client)/` — Protected client PWA with bottom nav → URLs: `/carte`, `/historique`, `/profil`
- `admin/` — **Real folder** (not a route group) → URLs: `/admin/dashboard`, `/admin/scanner`, `/admin/clients`, `/admin/programme`, `/admin/recompenses`
- `scan/` — Legacy QR landing page (old flow, kept for compatibility)
- `api/` — All API routes; admin routes under `api/admin/*` require `role === 'ADMIN'`

**Important:** `admin/` uses a real directory (not a route group) so that `/admin/*` URL prefixes work.

### Auth & Security
- NextAuth v4 with JWT strategy. `lib/auth.ts` configures the Credentials provider.
- `middleware.ts` uses `withAuth`: blocks `/carte`, `/historique`, `/profil`, `/admin/*` for unauthenticated users; blocks non-ADMINs from `/admin/*`.
- Session includes `user.id` (string) and `user.role`. Type augmentation in `types/next-auth.d.ts`.
- All API routes call `getServerSession(authOptions)` — never trust client-sent user IDs.

### QR Stamp Flow (current)
1. Client registers → gets a unique `qrToken` (UUID) on their `User` record → `LoyaltyCard` auto-created.
2. Client opens `/carte` → sees their personal QR code (encodes their `qrToken`).
3. Admin opens `/admin/scanner` → scans client QR → `GET /api/admin/scan/[token]` returns client profile + stamps.
4. Admin clicks "Ajouter un tampon" → `POST /api/admin/stamps/add` → increments stamps, creates `Reward` if threshold reached.
5. If reward unlocked → admin modal: **"Donner maintenant"** (marks `Reward.isUsed=true`) or **"Garder pour plus tard"** (reward stays pending, client sees it in their account).

### Data Model Key Points
- `User.qrToken` — unique UUID per client, used to identify them when admin scans their card.
- One `LoyaltyProgram` active at a time. New users get a `LoyaltyCard` linked to the active program on registration.
- `Stamp.grantedBy` = admin user ID when merchant adds stamp via scanner.
- `Reward.isUsed` toggled by admin via `PATCH /api/admin/rewards/[id]` (immediate redemption) or left false (client keeps for later).
- `SmtpSettings` table — merchant configures SMTP in `/admin/programme`. Loaded dynamically in `lib/email.ts` (overrides env vars).

### Email
- `lib/email.ts` exports `sendEmail()` + three templates: `welcomeEmailTemplate`, `stampEmailTemplate`, `rewardEmailTemplate`.
- `sendEmail()` calls `getSmtpConfig()` which checks `SmtpSettings` DB first, falls back to env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- Email sending is **non-blocking** in all API routes (wrapped in `try/catch`).
- Triggered at: registration (welcome), every stamp add (stamp or reward email).
- SMTP config UI: `/admin/programme` → "Configuration email (SMTP)" section with test-send button.

### Frontend Patterns
- `QrScanner` component must be loaded with `dynamic(..., { ssr: false })` — uses browser camera APIs.
- `QRCodeSVG` (qrcode.react) also loaded with `dynamic(..., { ssr: false })` on client carte page.
- Tailwind custom colors: `dark-bg: #0B1F14`, `dark-card: #132D1C`, `dark-card2: #1A3526`, `accent-green: #3DD68C`.
- Client UI is dark green mobile design (`bg-[#0B1F14]`, glass cards, `#3DD68C` accents).
- Admin UI is light/white with `gray-900` accents.
- Toast notifications via `react-hot-toast`; `<Toaster>` mounted in `app/providers.tsx`.
- Admin charts use `recharts`.

### Next.js 15/16 Gotchas
- `params` in route handlers must be `Promise<{id: string}>` — always `await params`.
- `useSearchParams()` requires `<Suspense>` wrapper.
- `postcss.config.js` must exist (was missing, caused CSS not to load).
- Tailwind v3 (not v4) — v4 broke PostCSS API.
- Next.js 16: `middleware.ts` is deprecated, use `proxy.ts` (warning only, not blocking).

## Build & Deploy Rules (DO NOT REPEAT)

### Prisma Schema Changes
- After ANY `schema.prisma` change: run `npx prisma generate` locally BEFORE committing/type-checking.
- **NEVER add `prisma migrate deploy` to Vercel build command.** It fails when:
  1. DB is unreachable from the Vercel build server
  2. Table already exists (from previous `db push`) without `IF NOT EXISTS`
- Build command must stay: `prisma generate && next build`
- For new tables in production: run `npx prisma db push` once locally with the prod DATABASE_URL.
- Migration SQL files must use `CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE` to be idempotent.

### TypeScript Null Narrowing in Closures
TypeScript does NOT preserve null-narrowing inside nested function closures.
```typescript
// BAD — TypeScript error: 'x' is possibly 'null' inside tick()
const x = ref.current
if (!x) return
function tick() { x.foo() }  // ← Error!

// GOOD — capture as explicitly typed const after null check
const x = ref.current
if (!x) return
const safeX: HTMLElement = x  // TypeScript infers non-null
function tick() { safeX.foo() }  // ✓
```
Apply this pattern for ALL refs used inside nested functions (canvas, ctx, video, etc.).

### Fetch Error Handling
Always check `r.ok` before calling `.json()` and setting state. A non-2xx response
still resolves the fetch promise and `.json()` gives `{ error: '...' }`, setting
state to an invalid object that crashes component renders.
```typescript
// BAD — sets settings = { error: 'DB error' } → crash on settings.name.length
fetch('/api/...').then(r => r.json()).then(data => setState(data))

// GOOD — keeps state as null on error, shows error message instead
fetch('/api/...')
  .then(r => { if (!r.ok) throw new Error(); return r.json() })
  .then((data: MyType) => setState(data))
  .catch(() => setLoading(false))
```

## Architecture Rules

### PWA Settings
- `PwaSettings` is a **separate table**, completely independent from `LoyaltyProgram`.
- `themeColor` / `backgroundColor` have ZERO relation to `cardColor1` / `cardColor2`.
- NEVER synchronize PWA colors with card colors automatically.
- `/admin/pwa` is ADMIN-ONLY — add to `ADMIN_ONLY` array in middleware.
- The `parametres` page PWA tab is **fully removed** (not a redirect, not a tab). `/admin/pwa` is the only entry point. Do not add PWA back to parametres.

### Admin Route Access Control
ADMIN_ONLY routes (staff cannot access) — always keep this list updated in `middleware.ts`:
```
/admin/parametres, /admin/programme, /admin/promotions,
/admin/qrcodes, /admin/staff, /admin/pwa
```

### Zod — Always add `.nullable()` on optional fields sent as null
Frontend often sends `null` for empty optional fields (`field || null`). Zod `.optional()` only accepts `undefined`, NOT `null`. Always add `.nullable()` on optional fields in POST/PATCH schemas.
```typescript
// BAD — rejects null → "Invalid input" 400
imageUrl: z.string().url().optional().or(z.literal(''))

// GOOD — accepts null, undefined, '', or valid URL
imageUrl: z.string().url().max(500).optional().nullable().or(z.literal(''))
couponCode: z.string().max(191).optional().nullable().or(z.literal(''))
```
**Incident:** Promotions POST returned "Invalid input" because the frontend sent `{ couponCode: null }` but Zod didn't have `.nullable()`. The PATCH route (which worked) already had `.nullable()` — always match POST schema to PATCH schema for optional fields.

### PWA Manifest — Icons
- **MIME type**: Always detect from URL extension — never hardcode `'image/png'` for uploaded logos (can be JPEG/WebP from Cloudinary).
- **`purpose`**: Use `'any'` for user-uploaded logos. NEVER use `'any maskable'` or `'maskable'` on logos without explicit maskable padding — it crops the image with a 40% safe-zone, hiding the logo.
- **`apple-touch-icon`**: Do NOT hardcode `<link rel="apple-touch-icon" href="/icons/icon-192.png" />` in layout.tsx. Use `generateMetadata()` with `icons: { apple: logoUrl }` instead. A hardcoded link to a missing file (404) overrides the dynamic metadata.
- **`public/icons/`** folder is empty — fallback icons don't exist. If `pwa.logoUrl` is not set, the manifest returns icon paths that 404. Always configure a logo in `/admin/pwa`.

### Validation
All API route inputs validated with Zod. Pattern: parse at top of handler, catch `ZodError` for 400 response.

### Prisma
Singleton client in `lib/prisma.ts` — import as `import { prisma } from '@/lib/prisma'`.

---

## Full Product Spec (Owner's Vision)

### Concept
Loyalty stamp system. The merchant configures their program: how many purchases = a reward (e.g. 10 pizzas bought = 1 free, or a drink, or any benefit the merchant chooses).

### Merchant Interface
**Client management:**
- Client list, leads, transaction history

**Dashboard:**
- Top clients, activity by day/month/year, general stats

**QR Scanner:**
- Scan client QR code
- Add a stamp
- Validate an action
- Correct errors (e.g. added 2 stamps instead of 1 → fix)

**Loyalty card customization:**
- Colors, logo, description of offer
- Expiry date (30 days, 3 months, 360 days, or never)
- SVG icon on card

**Client search:** by phone, first/last name, email

**Advanced settings:**
- Logo & favicon change
- SEO title
- SMTP configuration
- Customizable email templates

### Client Interface
**Auth:** login, register, email validation (togglable by merchant)

**User profile:** personal info, delete account

**Loyalty card:** auto-generated on signup, transaction history

**Promotional space:** offers from merchant (images, GIFs)

**Password reset:** via OTP (admin configures OTP validity duration)

### Automation & Notifications
**Automatic emails:**
- On stamp added: "Félicitations ! Vous avez X tampons. À bientôt chez [Nom] !"
- Re-engagement: if client hasn't visited in 15 days (configurable): "Cela fait longtemps…"
- Reward expiry: reward can expire per merchant-defined rules

### What's Implemented ✅
- Auth (login/register) with role-based access
- Client QR code on their loyalty card
- Admin scanner: scan client QR → view profile → add stamp
- Reward flow: give now or save for later
- Program configuration (stamps required, reward label, active toggle)
- SMTP configuration in admin panel (DB-stored, overrides env vars)
- Dashboard with stats and charts
- Client list with history
- Rewards management page
- Dark green mobile UI for clients
- Email templates (welcome, stamp, reward)
- PWA manifest + service worker
- `/admin/pwa` — fully configurable PWA settings (name, colors, logo, splash, offline message, install prompt). Independent `PwaSettings` table. Live iOS/Android mockup. Dynamic `/api/manifest` route.
- `/admin/promotions` — create/edit/delete promos with image upload (file upload + URL field), coupon code, CTA button, expiry date, active toggle

### Pending / TODO
- Promotional space (merchant broadcasts images/GIFs to clients)
- Promotional space (merchant broadcasts images/GIFs to clients)
- Email validation on signup (toggleable)
- Password reset via OTP
- Re-engagement email automation (cron job)
- Customizable email templates in admin UI
- SEO title + favicon customization
- Multiple loyalty programs support

---

## Original Full Spec — PROMPT v2.0

**Stack:** Next.js 15 · MySQL · Prisma · TypeScript · Tailwind CSS
**Type:** PWA full-stack, loyalty stamp system, merchant-configurable

### Part 1 — Init & Config
- Next.js 15, TypeScript strict, App Router, Tailwind, ESLint
- Prisma + MySQL, `.env` with DATABASE_URL / NEXTAUTH_SECRET / NEXTAUTH_URL / JWT_SECRET / SMTP_*
- Schema: User, LoyaltyProgram, LoyaltyCard, Stamp, Reward, QRCode, Role enum
- NextAuth Credentials provider, JWT session, role+id in token callbacks
- Middleware protecting `/admin/*` (ADMIN only) and `/carte /historique /profil` (auth)
- PWA: manifest.json + /public/sw.js service worker

### Part 2 — Auth
- `/login`: email+password, redirect to `/carte` (CLIENT) or `/admin/dashboard` (ADMIN)
- `/register`: name, email, password+confirm, phone (optional) → creates User + LoyaltyCard + welcome email
- `POST /api/auth/register`: validate unique email, bcrypt hash, create User+Card, trigger welcome email
- Middleware protects routes by role

### Part 3 — Client PWA Interface
- `/carte`: visual stamp grid (filled/empty circles), X/N counter, animated progress bar, confetti on completion, "Scanner QR" button
- `/historique`: chronological stamp list, rewards list, month filter
- `/profil`: view/edit name+phone, logout, stats (total stamps/rewards)
- Fixed bottom nav: Carte · Historique · Profil
- APIs: `GET /api/cards/me`, `GET /api/stamps/me`, `PATCH /api/users/me`

### Part 4 — QR Code & Stamp System
**Current implementation (v2 — reversed flow):**
- Client has a personal QR code (their `qrToken` UUID) shown on `/carte`
- Admin scans client QR at `/admin/scanner` → `GET /api/admin/scan/[token]`
- Admin adds stamp → `POST /api/admin/stamps/add` → increments stamps, creates Reward if threshold reached
- Reward decision modal: "Give now" (mark isUsed=true) or "Save for later" (pending in client account)
- Admin can also search clients by name/email/phone at `/admin/scanner` (search tab)

**Legacy (kept for compatibility):**
- Admin generates QR codes at `/admin/qrcodes` (uuid tokens, single/multi-use, optional expiry)
- `POST /api/qr/generate`, `GET /api/qr/list`
- `/scan?token=` page → `POST /api/stamps/redeem`

### Part 5 — Email Notifications
- Nodemailer in `lib/email.ts`, SMTP config stored in DB (`SmtpSettings` table), falls back to env vars
- SMTP configurable at `/admin/programme` (host, port, user, pass, from + test send)
- Templates: welcome (on register), stamp received (on stamp add), reward unlocked
- All email sends are non-blocking (try/catch, won't fail the main action)
- `POST /api/email/test` (admin only)

### Part 6 — Admin Dashboard
- Layout: fixed sidebar (Dashboard · Scanner · Clients · Programme · Récompenses), mobile drawer
- `/admin/dashboard`: metric cards (clients, stamps, rewards, completion rate), bar chart (stamps/day 30d), recent activity
- `/admin/clients`: paginated table, search by name/email, click for detail modal
- `/admin/programme`: edit program (name, description, stamps slider 3–20, reward label, active toggle) + SMTP config section
- `/admin/recompenses`: list all rewards, "Mark as used" button per row
- `/admin/scanner`: scan client QR OR search by name/email/phone → view profile + stamps + add stamp button

### Cross-cutting rules
- TypeScript strict, no `any`
- All API routes: try/catch, appropriate HTTP codes, Zod input validation
- Prisma singleton in `lib/prisma.ts`
- All `/api/admin/*` check `session.user.role === 'ADMIN'`
- Mobile-first client UI
- Loading states on all async actions
- Toast notifications via `react-hot-toast`
