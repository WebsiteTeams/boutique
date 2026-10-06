# UMA Designers

Boutique e-commerce storefront and admin panel for UMA Designers — sarees, chudithars and made-to-measure blouses.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM on libSQL/SQLite.

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run db:setup               # apply migrations + seed the starter catalog
npm run dev
```

Open http://localhost:3000.

To create the first admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (10+ characters) in `.env.local` and run `npm run db:seed` again. Then sign in at `/login` and open `/admin`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development, production build, production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a SQL migration after editing `src/server/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations from `./drizzle` |
| `npm run db:seed` | Seed catalog, collections, the `UMA10` coupon, rewards rules and the admin account (idempotent) |
| `npm run db:setup` | `db:migrate` + `db:seed` |

## Configuration

Every setting is documented in [.env.example](.env.example). Nothing is required to run locally, but each integration stays switched off until it is configured — the site never fakes it:

| Feature | Variables | Without them |
| --- | --- | --- |
| Database | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Local file `./data/uma.db` |
| Online payments (Razorpay) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Only Cash on Delivery is offered |
| Emails (Resend) | `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | No emails; admin alerts still appear in the dashboard |
| Image storage (Cloudinary) | `CLOUDINARY_*` | Uploads saved to `UPLOAD_DIR` on local disk |
| WhatsApp stylist | `NEXT_PUBLIC_WHATSAPP_NUMBER` | "Chat with a Stylist" links to the contact page |
| Social links, phone | `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_SUPPORT_PHONE` | The link / section is hidden |
| Canonical URLs, sitemap | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

Razorpay webhook: point it at `/api/payments/razorpay/webhook` with the events `payment.captured`, `payment.failed` and `order.paid`.

### Production notes

- Use a hosted libSQL database (e.g. Turso) and Cloudinary on serverless hosts — a local SQLite file and local uploads only persist on a single long-running server.
- Run `npm run db:migrate` as part of each deploy.
- Rate limiting is in-memory per server instance; back it with a shared store if you run several instances.

## Project layout

```
src/
├── app/                 Pages and API route handlers (app/api/**)
├── components/          UI components (storefront, account, admin)
├── context/store.tsx    Auth, cart, wishlist and toast state (persistent)
├── lib/                 Shared, framework-free logic used by client and server
│   ├── pricing.ts       Subtotal / coupon / shipping / total rules
│   ├── status.ts        Order, payment, appointment and stock statuses
│   ├── blouse.ts        Custom blouse pricing and measurements
│   └── config.ts        Contact details, social links, WhatsApp
└── server/              Server-only code
    ├── db/              Drizzle schema and client
    ├── auth/            Password hashing and sessions
    ├── services/        Business logic (products, orders, payments, account…)
    ├── validators/      Zod schemas for every API input
    ├── middleware/      Rate limiting
    └── http.ts          Route wrapper: auth, validation, error handling
drizzle/                 SQL migrations
scripts/                 Database migrate / seed scripts
```

Business rules live in `src/lib` and `src/server/services` — cart, checkout, order creation and admin all call the same functions.
