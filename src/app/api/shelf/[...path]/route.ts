import { neonAuthEnabled } from "@/features/account/neon/config";
import { neonAuth } from "@/features/account/neon/server";

const publicReads = new Set(["explore", "institutions", "capabilities", "health"]);
const backend = process.env.SHELF_API_ORIGIN ?? "http://localhost:8080";
const origin = process.env.SHELF_WEB_ORIGIN ?? "http://localhost:3000";

function problem(status: number, detail: string) {
  return Response.json({ detail }, { status, headers: { "Cache-Control": "no-store" } });
}

async function forward(request: Request, { params }: RouteContext<"/api/shelf/[...path]">) {
  if (!neonAuthEnabled) return problem(404, "This route is unavailable.");
  const read = request.method === "GET";
  if (!read && request.headers.get("origin") !== origin) {
    return problem(403, "This request must originate from Shelf.");
  }
  const { path } = await params;
  if (path.some((segment) => !/^[\w-]+$/.test(segment))) return problem(404, "Unknown Shelf route.");
  const resource = path.join("/");
  const guestRead = read && (publicReads.has(resource) || /^institutions\/[\w-]+\/courses$/.test(resource));
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  let sessionCookies: string[] = [];

  try {
    if (!guestRead) {
      const tokenRequest = new Request(new URL("/api/auth/token", origin), {
        headers: { cookie: request.headers.get("cookie") ?? "" },
      });
      const response = await neonAuth().handler().GET(tokenRequest, { params: Promise.resolve({ path: ["token"] }) });
      if (response.status >= 500) return problem(503, "Sign-in is temporarily unavailable.");
      const data = response.ok ? await response.json() : null;
      if (typeof data?.token !== "string" || !data.token) {
        return problem(401, "Sign in to continue.");
      }
      sessionCookies = response.headers.getSetCookie();
      headers.set("Authorization", "Bearer " + data.token);
    }
    const upstream = await fetch(new URL("/api/" + resource + new URL(request.url).search, backend), {
      method: request.method,
      body: read ? undefined : request.body,
      duplex: "half",
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    } as RequestInit);
    if (!guestRead && upstream.status === 401) {
      return problem(502, "Neon signed you in, but Shelf could not validate the session. Check that both apps use the same Neon branch.");
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const cookie of sessionCookies) responseHeaders.append("Set-Cookie", cookie);
    for (const name of ["content-type", "location"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return problem(503, "Shelf is temporarily unavailable.");
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
