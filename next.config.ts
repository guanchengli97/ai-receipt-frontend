import type { NextConfig } from "next";

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

function normalizeBackendOrigin(origin: string) {
  return normalizeOrigin(origin).replace(/\/api$/, "");
}

const nextConfig: NextConfig = {
  async rewrites() {
    const defaultOrigin =
      process.env.NODE_ENV === "production"
        ? "https://aireceipt-backend.guanchengli.com"
        : "http://localhost:8080";

    const backendOrigin = normalizeBackendOrigin(
      process.env.AIRECEIPT_BACKEND_ORIGIN ?? defaultOrigin
    );

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
