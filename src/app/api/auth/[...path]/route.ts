import { neonAuthEnabled } from "@/features/account/neon/config";
import { neonAuth } from "@/features/account/neon/server";

type Context = RouteContext<"/api/auth/[...path]">;

function dispatch(method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") {
  return (request: Request, context: Context) => neonAuthEnabled
    ? neonAuth().handler()[method](request, context)
    : new Response(null, { status: 404 });
}

export const GET = dispatch("GET");
export const POST = dispatch("POST");
export const PUT = dispatch("PUT");
export const DELETE = dispatch("DELETE");
export const PATCH = dispatch("PATCH");
