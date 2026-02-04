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

`/api/s3-upload` now returns:
- `uploadUrl` (signed PUT URL for browser direct upload to S3)
- `url` (signed GET URL sent to `/api/receipts/parse`)

Because upload is direct from browser to S3, configure S3 CORS to allow `PUT` from your frontend domain(s).

4) Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Amplify deployment note

If you deploy to Amplify SSR, set runtime variables in Amplify with non-`AWS_` names:

- `S3_REGION`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL` (optional)
- `S3_SIGNED_URL_EXPIRES` (optional)

This repo includes `amplify.yml` to write those values into `.env.production` during build so Next runtime can read them.
