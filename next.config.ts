import type { NextConfig } from "next";

const backend = process.env.SHELF_API_ORIGIN ?? "http://localhost:8080";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async rewrites() {
    if (process.env.NEXT_PUBLIC_SHELF_NEON_AUTH === "true") return [];
    return { beforeFiles: [{ source: "/api/:path*", destination: backend + "/api/:path*" }] };
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};
export default config;
