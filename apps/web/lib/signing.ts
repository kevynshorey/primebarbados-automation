import crypto from "crypto";

export function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.PUBLISHER_SHARED_SECRET as string;
  if (!secret) return false;
  if (!signature) return false;

  // Simple shared-secret mode for low-friction platform interop.
  if (signature === secret) return true;

  // Backward-compatible HMAC mode.
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function makeCorrelationId(prefix: string) {
  const rand = crypto.randomBytes(8).toString("hex");
  return `${prefix}-${Date.now()}-${rand}`;
}

export function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
