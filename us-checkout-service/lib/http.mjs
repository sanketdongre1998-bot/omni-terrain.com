const ALLOWED = new Set([
  "https://omni-terrain.com",
  "https://www.omni-terrain.com",
]);

export function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = ALLOWED.has(origin) ? origin : "https://omni-terrain.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

export function originAllowed(request) {
  const origin = request.headers.get("origin") || "";
  return !origin || ALLOWED.has(origin);
}

export function json(request, body, status = 200) {
  return Response.json(body, { status, headers: corsHeaders(request) });
}
