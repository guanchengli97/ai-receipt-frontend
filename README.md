This is a [Next.js](https://nextjs.org) project.

## Local setup

1) Create local env:

```bash
cp .env.example .env.local
```

2) Configure backend proxy target:

- `AIRECEIPT_BACKEND_ORIGIN=http://localhost:8080`

3) Configure S3 upload for dashboard camera flow:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID` (optional in cloud if IAM role is attached)
- `AWS_SECRET_ACCESS_KEY` (optional in cloud if IAM role is attached)
- `AWS_S3_PUBLIC_BASE_URL` (optional; custom public/CDN base URL)
- `AWS_S3_SIGNED_URL_EXPIRES` (optional, seconds, default `3600`)

`/api/s3-upload` returns a signed read URL (`url`) so `/api/receipts/parse` can read private S3 objects.

4) Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
