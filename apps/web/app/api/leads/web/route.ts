import { supabase } from "../../../../lib/supabase";
import { verifySignature, makeCorrelationId } from "../../../../lib/signing";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const input = JSON.parse(raw);
  const corr = input.correlation_id || makeCorrelationId("LEAD");

  const name = input.name || null;
  const email = input.email || null;
  const phone = input.phone || null;
  const message = input.message || null;

  const ins = await supabase.from("leads").insert({
    correlation_id: corr,
    source: "web",
    name, email, phone, message,
    intent_score: Number(input.intent_score || 0),
    tags: input.tags || [],
    raw: input
  }).select("id").single();

  if (ins.error) return Response.json({ ok: false, correlation_id: corr, error: ins.error }, { status: 500 });

  await supabase.from("approvals").insert({
    correlation_id: corr,
    kind: "lead_follow_up",
    channel: "whatsapp",
    payload: {
      to: phone,
      template: "pb_lead_followup_1",
      variables: { name: name || "there" }
    },
    status: "pending"
  });

  return Response.json({ ok: true, correlation_id: corr, lead_id: ins.data.id });
}
