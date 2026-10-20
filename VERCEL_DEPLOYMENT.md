# Deploying ApnaKit to Vercel

Two separate Vercel projects, both pointing at this repository:

| Project | Root directory | What it is |
|---|---|---|
| `apnakit-api` | `backend` | NestJS API as a Vercel Serverless Function |
| `apnakit` | `frontend` | Next.js 15 storefront |

Deploy the **backend first** — the frontend build needs its URL.

---

## 1. Backend project

```bash
cd backend
vercel          # create project, name it apnakit-api, link to AlokMishrra/Apnakit
```

Then add environment variables (`vercel env add`, or paste into the dashboard):

```
NODE_ENV                  production
PORT                      3000
DATABASE_URL              <your existing Postgres connection string>
SWAGGER_ENABLED           true            # set false to skip Swagger on cold starts

# Required
JWT_SECRET                <long random string>
JWT_ACCESS_EXPIRY         15m
JWT_REFRESH_SECRET        <long random string>
JWT_REFRESH_EXPIRY        7d

# CORS — the frontend's production domain(s), comma separated
CORS_ORIGINS              https://apnakit.in,https://www.apnakit.in
PUBLIC_FRONTEND_URL       https://apnakit.in
PUBLIC_BACKEND_URL        https://apnakit-api.vercel.app

# Object storage — at least one pair is required for uploads to work
SUPABASE_URL              ...
SUPABASE_SERVICE_KEY      ...              # or SUPABASE_ANON_KEY
SUPABASE_STORAGE_BUCKET   apnakit-uploads
# and/or
AWS_S3_BUCKET             ...
AWS_ACCESS_KEY_ID         ...
AWS_SECRET_ACCESS_KEY     ...
AWS_REGION                ap-south-1

# Optional integrations
GOOGLE_CLIENT_ID          ...
GOOGLE_CLIENT_SECRET      ...
RAZORPAY_KEY_ID           ...
RAZORPAY_KEY_SECRET       ...
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
BREVO_API_KEY
MSG91_AUTH_KEY / MSG91_TEMPLATE_ID / MSG91_SENDER_ID / MSG91_ENABLED
FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
REDIS_URL
```

Then deploy:

```bash
vercel --prod
curl https://apnakit-api.vercel.app/api/v1/health   # expect {"data":{"status":"ok",...}}
```

---

## 2. Frontend project

```bash
cd ../frontend
vercel          # create project, name it apnakit, link to AlokMishrra/Apnakit
```

Environment variables:

```
BACKEND_URL                    https://apnakit-api.vercel.app   # build-time, used for rewrites
NEXT_PUBLIC_APP_URL            https://apnakit.in

NEXT_PUBLIC_RAZORPAY_KEY_ID    rzp_live_...
NEXT_PUBLIC_SUPABASE_URL       ...
NEXT_PUBLIC_SUPABASE_ANON_KEY  ...   # required if uploads use Supabase
NEXT_PUBLIC_FIREBASE_*         ...
NEXT_PUBLIC_TRUECALLER_KEY     ...
```

```bash
vercel --prod
```

---

## How the requests flow

```
Browser
  └─> https://apnakit.in/api/v1/products          (same origin)
        └─> Next.js rewrite  ──> https://apnakit-api.vercel.app/api/v1/products
                                  └─> serverless function ──> Postgres
```

Uploads skip the API entirely (see below).

---

## Uploads

Vercel caps serverless request bodies at **4.5 MB**. Product videos (50 MB),
APKs (200 MB) and IPKs (300 MB) can never be proxied through the function.

The new flow, implemented in `backend/src/modules/upload/upload.service.ts`
and `frontend/src/lib/upload.ts`:

1. Browser calls `POST /api/v1/upload/presign` with `{ kind, fileName, contentType, size }`.
   The API validates the request against `UPLOAD_KIND_SPECS` and returns a
   short-lived ticket.
2. Browser PUTs the bytes straight to Supabase Storage or S3 — no API involved.
3. Browser sends the returned public URL to the normal create/update endpoint.

The old multipart endpoints still exist and still work for small files.

**Note:** S3 presigned PUTs include `ACL: public-read`. If your bucket blocks
public ACLs, either drop `ACL` from `presignS3()` in
`backend/src/modules/upload/upload.service.ts` and rely on a bucket policy, or
configure the bucket to allow it.

---

## Cold starts and connections

The Nest container is built once per warm instance (`backend/api/[[...path]].ts`),
so the first request on a cold instance pays for module init. Two things to know:

- Set `SWAGGER_ENABLED=false` to skip Swagger, which walks the whole module graph.
- **Use a pooled Postgres connection string.** A serverless function can open many
  concurrent connections across instances; the direct URL will exhaust the DB.
  With Neon/Supabase use the pooler URL, and append
  `?connection_limit=1&pgbouncer=true` (Prisma 5) to the `DATABASE_URL`.

---

## ⚠️ Do not run `prisma migrate deploy` against production

`backend/prisma/migrations/` is **out of sync with `prisma/schema.prisma`**.
Diffing the two shows missing tables (`ProductCategory`, `PasswordReset`),
columns (`Product.isVeg`, `Category.isComingSoon`, the whole `AppBannerConfig`
app-download block), and an enum (`BannerMediaType`).

The generated sync SQL also contains destructive statements such as
`ALTER TABLE "Order" DROP COLUMN "couponId"` — the production database clearly
was **not** built from these migrations (it was pushed with `prisma db push` or
maintained by hand). Running the migrations against production would drop real
data.

Consequences:

- The Vercel backend build only runs `prisma generate`, never `migrate deploy`.
  It simply connects to your existing database. This is deliberate.
- Do not provision a fresh database from `prisma/migrations/` — it will be
  missing columns and the app will 500.
- Fixing this properly means diffing against the real production schema first.
  That is a separate piece of work.