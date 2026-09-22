import { corsHeaders, json } from "../lib/cors.mjs";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function GET(request) {
  const gatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY);
  const oidc = Boolean(process.env.VERCEL_OIDC_TOKEN);
  const openai = Boolean(process.env.OPENAI_API_KEY);

  return json({
    ok: true,
    service: "Omni AI",
    configured: gatewayKey || oidc || openai,
    auth: oidc ? "vercel-oidc" : gatewayKey ? "ai-gateway-key" : openai ? "openai-key" : "fallback-only",
    model: "openai/gpt-5.6-luna",
    fallbackModel: "openai/gpt-5.6-terra",
  }, 200, request);
}
