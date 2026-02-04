import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function readAmplifySecrets() {
  const raw = process.env.secrets;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((accumulator, line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex <= 0) {
          return accumulator;
        }
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        if (key && value) {
          accumulator[key] = value;
        }
        return accumulator;
      }, {});
  }
}

function readEnv(name: string) {
  const value = process.env[name];
  if (value && value.trim()) {
    return value.trim();
  }

  const secretValue = readAmplifySecrets()[name];
  if (typeof secretValue === "string" && secretValue.trim()) {
    return secretValue.trim();
  }

  return "";
}

function readFirstEnv(names: string[]) {
  for (const name of names) {
    const value = readEnv(name);
    if (value) {
      return value;
    }
  }
  return "";
}

function requiredEnv(...names: string[]) {
  const value = readFirstEnv(names);
  if (!value) {
    throw new Error(`Missing environment variable: ${names.join(" / ")}`);
  }
  return value;
}

function optionalEnv(...names: string[]) {
  return readFirstEnv(names);
}

function extensionFromName(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "jpg";
}

function createS3Client(region: string) {
  const accessKeyId = optionalEnv("AWS_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID");
  const secretAccessKey = optionalEnv("AWS_SECRET_ACCESS_KEY", "S3_SECRET_ACCESS_KEY");

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return new S3Client({ region });
}

export async function POST(request: Request) {
  try {
    const region = requiredEnv("AWS_REGION", "S3_REGION");
    const bucket = requiredEnv("AWS_S3_BUCKET", "S3_BUCKET");
    const signedUrlExpiresSeconds = Number(
      optionalEnv("AWS_S3_SIGNED_URL_EXPIRES", "S3_SIGNED_URL_EXPIRES") || "3600"
    );
    const body = await request.json().catch(() => null);
    const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const fileName = typeof payload.fileName === "string" ? payload.fileName : "";
    const contentType = typeof payload.contentType === "string" ? payload.contentType : "";

    if (!fileName.trim()) {
      return NextResponse.json({ message: "fileName is required." }, { status: 400 });
    }

    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files are supported." }, { status: 400 });
    }

    const extension = extensionFromName(fileName);
    const key = `receipts/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const client = createS3Client(region);
    const expiresIn = Number.isFinite(signedUrlExpiresSeconds) ? signedUrlExpiresSeconds : 3600;

    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn }
    );

    const signedReadUrl = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn }
    );

    return NextResponse.json({
      uploadUrl,
      url: signedReadUrl,
      key,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create upload URL.",
      },
      { status: 500 }
    );
  }
}
