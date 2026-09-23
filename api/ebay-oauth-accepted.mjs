export function GET(request) {
  const url = new URL(request.url);
  const hasCode = Boolean(url.searchParams.get("code"));
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMNI Terrain — eBay Authorization</title></head><body style="font-family:system-ui;max-width:720px;margin:60px auto;padding:0 20px"><h1>eBay authorization received</h1><p>${hasCode ? "Authorization was accepted. You can return to the eBay Developer Portal." : "This endpoint is ready for eBay OAuth redirects."}</p></body></html>`;
  return new Response(html,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
