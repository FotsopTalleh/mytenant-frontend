import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type Env = {
  /** Set this in Cloudflare Workers dashboard → Settings → Variables & Secrets.
   *  Value: your Railway backend URL, e.g. https://mytenant-backend-production.up.railway.app
   *  DO NOT commit this value to git. */
  API_URL?: string;
};

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// ── /api proxy ────────────────────────────────────────────────────────────────
// Intercepts every /api/* request and forwards it to the Railway Flask backend.
// The Railway URL is stored ONLY in the Cloudflare Worker secret API_URL —
// it never touches git or the frontend bundle.
async function handleApiProxy(request: Request, apiUrl: string): Promise<Response> {
  const url = new URL(request.url);
  const backendBase = apiUrl.replace(/\/$/, "");

  // Strip /api prefix, forward the rest to Flask
  const backendPath = url.pathname.replace(/^\/api/, "") + url.search;
  const target = `${backendBase}${backendPath}`;
  const backendHost = new URL(backendBase).host;

  // Build a clean header set for Flask.
  // We deliberately DROP Origin and Referer so Flask's CORS middleware sees
  // the request as same-origin and never blocks it. The Worker is the sole
  // entry point; Flask doesn't need to know about the Cloudflare domain.
  const forwardHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "origin" || lower === "referer" || lower === "host") continue;
    forwardHeaders.set(key, value);
  }
  forwardHeaders.set("host", backendHost);
  // Tell Flask the real client IP (optional but useful for rate-limiting)
  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) forwardHeaders.set("x-forwarded-for", clientIp);

  const proxyRequest = new Request(target, {
    method:  request.method,
    headers: forwardHeaders,
    body:    ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    duplex: "half",
  } as RequestInit & { duplex: string });

  try {
    const response = await fetch(proxyRequest);
    // Forward the response as-is; add CORS headers so the browser accepts it
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", url.origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    // Remove Flask's own CORS header if it sneaked through (avoid duplicates)
    headers.delete("vary");   // let the Worker control caching
    return new Response(response.body, { status: response.status, headers });
  } catch (err) {
    console.error("[api-proxy] fetch failed:", err);
    return new Response(
      JSON.stringify({ error: { message: "Backend unreachable", code: "PROXY_ERROR" } }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    const url = new URL(request.url);

    // Handle CORS preflight for /api/* requests
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  url.origin,
          "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Forward /api/* → Railway backend
    if (url.pathname.startsWith("/api/")) {
      const apiUrl = env.API_URL;
      if (!apiUrl) {
        console.error("[api-proxy] API_URL secret is not set in Cloudflare Worker environment.");
        return new Response(
          JSON.stringify({ error: { message: "API_URL not configured", code: "CONFIG_ERROR" } }),
          { status: 503, headers: { "content-type": "application/json" } }
        );
      }
      return handleApiProxy(request, apiUrl);
    }

    // All other requests → TanStack Start SSR
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
