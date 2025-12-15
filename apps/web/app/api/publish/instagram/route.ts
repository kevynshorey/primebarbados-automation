import { verifySignature } from "@/lib/signing";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const body = JSON.parse(raw);
  const accessToken = process.env.IG_ACCESS_TOKEN as string;
  const userId = process.env.IG_USER_ID as string;
  const apiBase = process.env.IG_API_BASE || "https://graph.facebook.com/v20.0";

  if (!accessToken || !userId) return Response.json({ ok: false, error: "ig_not_configured" }, { status: 400 });

  const imageUrl = body.image_url;
  const caption = body.caption || "";

  const createRes = await fetch(`${apiBase}/${userId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${encodeURIComponent(accessToken)}`);
  const create = await createRes.json();
  if (!createRes.ok) return Response.json({ ok: false, error: create }, { status: 400 });

  const publishRes = await fetch(`${apiBase}/${userId}/media_publish?creation_id=${encodeURIComponent(create.id)}&access_token=${encodeURIComponent(accessToken)}`, { method: "POST" });
  const published = await publishRes.json();
  if (!publishRes.ok) return Response.json({ ok: false, error: published }, { status: 400 });

  return Response.json({ ok: true, ig_media_id: published.id });
}
