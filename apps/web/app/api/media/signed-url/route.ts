
import { supabase } from "../../../../lib/supabase";
import { verifySignature, makeCorrelationId } from "../../../../lib/signing";
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const body = JSON.parse(raw);
  const mediaId = body.media_id as string;
  const expiresIn = Math.min(Number(body.expires_in_seconds || 3600), 3600);

  const asset = await supabase.from("media_assets").select("*").eq("id", mediaId).single();
  if (asset.error) return Response.json({ ok: false, error: "media_not_found" }, { status: 404 });

  const signed = await supabase.storage.from("media").createSignedUrl(asset.data.storage_path, expiresIn);
  if (signed.error) return Response.json({ ok: false, error: signed.error }, { status: 500 });

  return Response.json({
    ok: true,
    media_id: mediaId,
    signed_url: signed.data.signedUrl,
    mime_type: asset.data.mime_type,
    bytes: asset.data.bytes
  });
}
