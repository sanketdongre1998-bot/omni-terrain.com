export function GET() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMNI Terrain — eBay Authorization</title></head><body style="font-family:system-ui;max-width:720px;margin:60px auto;padding:0 20px"><h1>eBay authorization not granted</h1><p>No permissions were granted. You can return to the eBay Developer Portal and try again.</p></body></html>`;
  return new Response(html,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
