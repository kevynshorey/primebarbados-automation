import { supabase } from "../../../../lib/supabase";
import { verifySignature, makeCorrelationId, sha256 } from "../../../../lib/signing";
const allow = (process.env.PRIMEBARBADOS_ALLOWLIST || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const body = JSON.parse(raw);
  const corr = body.correlation_id || makeCorrelationId("MEDIA");

  const u = new URL(body.source_url);
  if (!allow.includes(u.hostname)) return Response.json({ ok: false, error: "domain_not_allowed" }, { status: 400 });

  const r = await fetch(body.source_url);
  if (!r.ok) return Response.json({ ok: false, error: `fetch_failed_${r.status}` }, { status: 400 });

  const ct = r.headers.get("content-type") || "application/octet-stream";
  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  const hash = sha256(buf);

  const ext =
    ct.includes("jpeg") ? "jpg" :
    ct.includes("png") ? "png" :
    ct.includes("mp4") ? "mp4" :
    "bin";

  const path = `imports/${corr}/${hash}.${ext}`;

  const up = await supabase.storage.from("media").upload(path, buf, {
    contentType: ct,
    upsert: false
  });

  if (up.error) return Response.json({ ok: false, error: up.error }, { status: 500 });

  const ins = await supabase.from("media_assets").insert({
    correlation_id: corr,
    source_type: "primebarbados_import",
    source_url: body.source_url,
    storage_path: path,
    mime_type: ct,
    bytes: buf.length,
    sha256: hash,
    license_owned_or_licensed: body.license_owned_or_licensed === true,
    model_release_on_file: body.model_release_on_file === true,
    property_id: body.property_id || null,
    photographer_credit: body.photographer_credit || null,
    restrictions: body.restrictions || null,
    meta: body.meta || {}
  }).select("id").single();

  if (ins.error) return Response.json({ ok: false, error: ins.error }, { status: 500 });

  return Response.json({ ok: true, correlation_id: corr, media_id: ins.data.id, storage_path: path, mime_type: ct });
}
