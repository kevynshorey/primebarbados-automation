import { verifySignature, makeCorrelationId } from "../../../../lib/signing";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  // This endpoint only records a TikTok publish job.
  // Actual upload is executed by scripts/tiktok_file_upload.js on a long-running worker.
  const body = JSON.parse(raw);
  return Response.json({ ok: true, queued: true, note: "Run scripts/tiktok_file_upload.js on worker" , payload: body });
}
