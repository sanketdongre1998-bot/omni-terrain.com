const ALLOWED = new Set([
  "https://omni-terrain.com",
  "https://www.omni-terrain.com",
]);

export function requestOrigin(request) {
  return request.headers.get("origin") || "";
}

export function originAllowed(request) {
  const origin = requestOrigin(request);
  return !origin || ALLOWED.has(origin);
}

export function corsHeaders(request) {
  const origin = requestOrigin(request);
  const allowedOrigin = ALLOWED.has(origin) ? origin : "https://omni-terrain.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export function json(data, status, request) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}
