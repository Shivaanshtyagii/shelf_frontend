import { neonAuthEnabled } from "@/features/account/neon/config";
import { neonAuth } from "@/features/account/neon/server";

export async function GET(request: Request) {
  if (!neonAuthEnabled) return redirect("/account");

  const origin = process.env.SHELF_WEB_ORIGIN ?? "http://localhost:3000";
  const verifier = new URL(request.url).searchParams.get("neon_auth_session_verifier");
  const sessionUrl = new URL("/api/auth/get-session", origin);
  sessionUrl.searchParams.set("disableCookieCache", "true");
  if (verifier) sessionUrl.searchParams.set("neon_auth_session_verifier", verifier);

  const sessionRequest = new Request(sessionUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const session = await neonAuth().handler().GET(sessionRequest, {
    params: Promise.resolve({ path: ["get-session"] }),
  });
  const data = session.ok ? await session.json() : null;
  return redirect(data?.session && data?.user ? "/" : "/account?error=neon-session", session.headers.getSetCookie());
}

function redirect(location: string, cookies: string[] = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
