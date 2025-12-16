import { supabase } from "../../../../lib/supabase";
import { makeCorrelationId } from "../../../../lib/supabase";

function verifyTwilio() {
  if (process.env.TWILIO_VERIFY_MODE === "off") return true;
  return false;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyTwilio();
  if (!ok) return Response.json({ ok: false, error: "twilio_signature_not_verified" }, { status: 401 });

  const params = new URLSearchParams(raw);
  const from = params.get("From") || "";
  const body = params.get("Body") || "";

  const corr = makeCorrelationId("WA");

  const ins = await supabase.from("leads").insert({
    correlation_id: corr,
    source: "whatsapp_inbound",
    phone: from,
    message: body,
    intent_score: 0,
    tags: ["whatsapp_inbound"],
    raw: Object.fromEntries(params.entries())
  }).select("id").single();

  if (ins.error) return Response.json({ ok: false, correlation_id: corr, error: ins.error }, { status: 500 });

  await supabase.from("approvals").insert({
    correlation_id: corr,
    kind: "whatsapp_reply",
    channel: "whatsapp",
    payload: {
      to: from,
      suggested_reply: "Thanks for messaging Prime Barbados. Please share your budget, preferred area, and whether you want sales, holiday rental, or long term rental."
    },
    status: "pending"
  });

  return new Response("ok", { status: 200 });
}
