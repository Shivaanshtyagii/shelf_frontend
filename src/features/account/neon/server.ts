import { createNeonAuth } from "@neon/auth/next/server";

let auth: ReturnType<typeof createNeonAuth> | undefined;

export function neonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    throw new Error("Configure NEON_AUTH_BASE_URL and a Neon cookie secret of at least 32 characters.");
  }
  return auth ??= createNeonAuth({ baseUrl, cookies: { secret } });
}
