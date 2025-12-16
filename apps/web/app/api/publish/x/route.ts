import { verifySignature, makeCorrelationId } from "../../../../lib/signing";

async function getAccessToken() {
  const clientId = process.env.X_CLIENT_ID as string;
  const clientSecret = process.env.X_CLIENT_SECRET as string;
  const refreshToken = process.env.X_REFRESH_TOKEN as string;
  if (!clientId || !clientSecret || !refreshToken) throw new Error("x_not_configured");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basic}`
    },
    body
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`x_token_refresh_failed_${res.status}_${JSON.stringify(out)}`);
  return out.access_token as string;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const body = JSON.parse(raw);
  const text = body.text as string;

  try {
    const token = await getAccessToken();
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const out = await res.json();
    if (!res.ok) return Response.json({ ok: false, error: out }, { status: 400 });
    return Response.json({ ok: true, tweet_id: out.data?.id, raw: out });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
