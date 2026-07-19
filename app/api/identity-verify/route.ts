import { NextResponse } from "next/server";
import {
  createIdentityToken,
  evaluateIdentityVerification,
  matchIdentityWithTwilio,
} from "@/lib/identity-match";
import { normalizeUsPhone } from "@/lib/phone";

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

function normalizeState(value: unknown) {
  const state = String(value || "").trim();
  if (/^[A-Za-z]{2}$/.test(state)) return state.toUpperCase();
  return stateAbbreviations[state] || "";
}

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

  const body = (await request.json().catch(() => null)) as {
    phone?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    city?: unknown;
    state?: unknown;
    zipCode?: unknown;
  } | null;

  const normalized = normalizeUsPhone(body?.phone);
  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();

  if (normalized.length !== 10) {
    return NextResponse.json(
      { ok: false, reason: "Ingresa un numero contactable de 10 digitos." },
      { status: 422 },
    );
  }
  if (!firstName || !lastName) {
    return NextResponse.json(
      { ok: false, reason: "Necesitamos tu nombre para verificar el numero." },
      { status: 422 },
    );
  }

  const result = await matchIdentityWithTwilio({
    phone: normalized,
    firstName,
    lastName,
    city: String(body?.city || "").trim(),
    state: normalizeState(body?.state),
    postalCode: String(body?.zipCode || "").replace(/\D/g, "").slice(0, 5),
    countryCode: "US",
  });

  const verdict = evaluateIdentityVerification(result);
  if (!verdict.pass) {
    return NextResponse.json(
      { ok: false, reason: verdict.reason, identity: result },
      { status: 422 },
    );
  }

  const verificationToken = createIdentityToken(normalized, result);
  if (!verificationToken) {
    return NextResponse.json(
      { ok: false, reason: "No pudimos verificar el numero ahora mismo. Intenta nuevamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, normalized, identity: result, verificationToken });
}
