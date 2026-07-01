import { NextResponse } from "next/server";
import {
  createPhoneVerificationToken,
  verifyPhoneWithVeriphone,
} from "@/lib/phone-verification";

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
  const result = await verifyPhoneWithVeriphone(body?.phone);
  const verificationToken = result.isValid
    ? createPhoneVerificationToken(result.normalized)
    : null;
  const ok = result.isValid && !!verificationToken;
  const flags = ok
    ? result.flags
    : verificationToken || !result.isValid
      ? result.flags
      : [...result.flags, "veriphone_not_configured"];
  const status = ok
    ? 200
    : flags.includes("veriphone_not_configured")
      ? 503
      : flags.includes("veriphone_request_failed")
        ? 502
        : 422;

  return NextResponse.json(
    {
      ok,
      normalized: result.normalized,
      reason: ok ? null : result.reason || "No pudimos verificar el número ahora mismo.",
      flags,
      veriphone: ok ? result.veriphone : null,
      verificationToken: ok ? verificationToken : null,
    },
    { status },
  );
}
