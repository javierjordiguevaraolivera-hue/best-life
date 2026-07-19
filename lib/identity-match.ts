import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeUsPhone } from "@/lib/phone";

const TWILIO_TIMEOUT_MS = 5000;
// 2 h: cubre a usuarios que se distraen entre verificar el telefono y enviar el
// email sin que el token caduque y bloquee el envio (perdiendo el lead).
const IDENTITY_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

// Solo aceptamos numeros MOVILES. Si Twilio no devuelve el tipo, NO bloqueamos.
const allowedLineTypes = new Set(["mobile"]);

// Valores que Twilio devuelve por atributo:
// exact_match | high_partial_match | partial_match | no_match | no_data
export type TwilioIdentityMatch = {
  first_name_match?: string;
  last_name_match?: string;
  address_lines_match?: string;
  city_match?: string;
  state_match?: string;
  postal_code_match?: string;
  address_country_match?: string;
  error_code?: number | null;
  identity_match_error_code?: number | null;
  summary_score?: number | null;
};

export type IdentityMatchResult = {
  // "skipped" cuando faltan credenciales o el servicio falla: nunca bloquea el lead.
  status: "matched" | "skipped";
  provider: "twilio";
  phoneValid: boolean | null;
  lineType: string | null;
  carrier: string | null;
  summaryScore: number | null;
  firstNameMatch: string | null;
  lastNameMatch: string | null;
  cityMatch: string | null;
  stateMatch: string | null;
  postalCodeMatch: string | null;
  errorCode: number | null;
  flags: string[];
};

function skippedResult(flags: string[]): IdentityMatchResult {
  return {
    status: "skipped",
    provider: "twilio",
    phoneValid: null,
    lineType: null,
    carrier: null,
    summaryScore: null,
    firstNameMatch: null,
    lastNameMatch: null,
    cityMatch: null,
    stateMatch: null,
    postalCodeMatch: null,
    errorCode: null,
    flags,
  };
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("placeholder") ||
    normalized.includes("your_") ||
    normalized.includes("replace_me") ||
    normalized === "changeme"
  );
}

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  if (isPlaceholder(accountSid) || isPlaceholder(authToken)) return null;
  return { accountSid, authToken };
}

export function isIdentityMatchConfigured() {
  return getCredentials() !== null;
}

export async function matchIdentityWithTwilio(input: {
  phone: string; // 10 digitos US
  firstName: string;
  lastName: string;
  city?: string;
  state?: string; // abreviatura de 2 letras (FL, TX...)
  postalCode?: string; // ZIP, 5 digitos
  countryCode?: string; // "US"
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<IdentityMatchResult> {
  const credentials = getCredentials();

  if (!credentials) {
    return skippedResult(["identity_match_not_configured"]);
  }

  const phone = input.phone.replace(/\D/g, "");
  if (phone.length !== 10 || !input.firstName.trim() || !input.lastName.trim()) {
    return skippedResult(["identity_match_missing_input"]);
  }

  // Este funnel NO pide fecha de nacimiento: no se envia DateOfBirth a Twilio.
  const params = new URLSearchParams({
    Fields: "identity_match,line_type_intelligence",
    FirstName: input.firstName.trim(),
    LastName: input.lastName.trim(),
    AddressCountryCode: input.countryCode?.trim() || "US",
  });
  if (input.city?.trim()) params.set("City", input.city.trim());
  if (input.state?.trim()) params.set("State", input.state.trim());
  if (input.postalCode?.trim()) params.set("PostalCode", input.postalCode.trim());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs ?? TWILIO_TIMEOUT_MS);

  try {
    const response = await (input.fetchImpl || fetch)(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(`+1${phone}`)}?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${credentials.accountSid}:${credentials.authToken}`,
          ).toString("base64")}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.error("Twilio Identity Match request failed", response.status);
      return skippedResult(["identity_match_request_failed"]);
    }

    const data = (await response.json().catch(() => null)) as {
      valid?: boolean | null;
      identity_match?: TwilioIdentityMatch | null;
      line_type_intelligence?: {
        type?: string | null;
        carrier_name?: string | null;
        error_code?: number | null;
      } | null;
    } | null;

    if (!data) {
      return skippedResult(["identity_match_empty_response"]);
    }

    const phoneValid = typeof data.valid === "boolean" ? data.valid : null;
    const lineType = data.line_type_intelligence?.type?.trim() || null;
    const carrier = data.line_type_intelligence?.carrier_name?.trim() || null;
    const match = data.identity_match;
    const base = { phoneValid, lineType, carrier };

    // Numero valido pero sin identidad => skipped, pero conservamos phoneValid/lineType.
    if (!match) {
      return { ...skippedResult(["identity_match_empty_response"]), ...base };
    }

    const providerErrorCode = match.error_code ?? match.identity_match_error_code ?? null;
    if (providerErrorCode) {
      return {
        ...skippedResult(["identity_match_provider_error"]),
        ...base,
        errorCode: providerErrorCode,
      };
    }

    const summaryScore = typeof match.summary_score === "number" ? match.summary_score : null;
    const flags: string[] = [];

    if (phoneValid === false) flags.push("identity_match_invalid_phone");
    if (lineType && !allowedLineTypes.has(lineType)) flags.push("identity_match_disallowed_line_type");
    if (summaryScore !== null && summaryScore < 40) flags.push("identity_match_low_score");
    if (match.first_name_match === "no_match" || match.last_name_match === "no_match") {
      flags.push("identity_match_name_mismatch");
    }

    return {
      status: "matched",
      provider: "twilio",
      ...base,
      summaryScore,
      firstNameMatch: match.first_name_match ?? null,
      lastNameMatch: match.last_name_match ?? null,
      cityMatch: match.city_match ?? null,
      stateMatch: match.state_match ?? null,
      postalCodeMatch: match.postal_code_match ?? null,
      errorCode: null,
      flags,
    };
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Twilio Identity Match failed", error);
    }
    return skippedResult(["identity_match_request_failed"]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Nivel de coincidencia de un atributo de nombre (mayor = mejor).
function nameMatchLevel(value: string | null): number {
  switch (value) {
    case "exact_match":
      return 3;
    case "high_partial_match":
      return 2;
    case "partial_match":
      return 1;
    default:
      // no_match, no_data, null => sin coincidencia utilizable
      return 0;
  }
}

// Regla de aprobacion SIN fecha de nacimiento. Solo bloquean senales inequivocas;
// "no_data" o servicio caido dejan pasar (con flag) para no matar el funnel.
export function evaluateIdentityVerification(result: IdentityMatchResult): {
  pass: boolean;
  reason: string;
} {
  // 1) Numero explicitamente invalido: bloquea SIEMPRE.
  if (result.phoneValid === false) {
    return { pass: false, reason: "Ese numero no parece valido. Revisalo e intenta de nuevo." };
  }

  // 2) No es movil (fijo, VoIP, etc.): solo aceptamos celulares.
  if (result.lineType && !allowedLineTypes.has(result.lineType)) {
    return { pass: false, reason: "Ingresa un numero de celular valido." };
  }

  // 3) Fail-open cuando NO tenemos informacion (servicio caido / sin credenciales /
  //    numero valido pero sin identidad): no matamos el funnel.
  if (result.status === "skipped") {
    return { pass: true, reason: "" };
  }

  // 4) Nombre: al menos UNO (nombre o apellido) con partial_match o mejor.
  //    ZIP / ciudad / estado / score => solo flags, NO bloquean.
  const bestNameLevel = Math.max(
    nameMatchLevel(result.firstNameMatch),
    nameMatchLevel(result.lastNameMatch),
  );

  if (bestNameLevel < 1) {
    return {
      pass: false,
      reason:
        "Este numero no parece estar a tu nombre. Intenta nuevamente con un numero que te pertenezca.",
    };
  }

  return { pass: true, reason: "" };
}

// ===== Token firmado: la verificacion viaja del paso de telefono al submit sin poder falsificarse =====

type IdentityTokenPayload = {
  phone: string;
  issuedAt: number;
  expiresAt: number;
  result: IdentityMatchResult;
};

function getSigningSecret() {
  const configured = process.env.PHONE_VERIFICATION_SECRET?.trim() || "";
  const fallback = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  const secret = !isPlaceholder(configured) ? configured : fallback;
  return secret ? `best-life:identity-match:v1:${secret}` : "";
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createIdentityToken(
  normalizedPhone: string,
  result: IdentityMatchResult,
  now = Date.now(),
) {
  const secret = getSigningSecret();
  const phone = normalizeUsPhone(normalizedPhone);
  if (!secret || phone.length !== 10) return null;

  const payload: IdentityTokenPayload = {
    phone,
    issuedAt: now,
    expiresAt: now + IDENTITY_TOKEN_TTL_MS,
    result,
  };
  const encodedPayload = encodeJson(payload);
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function validateIdentityToken(
  token: unknown,
  expectedPhone: unknown,
  now = Date.now(),
): IdentityMatchResult | null {
  const secret = getSigningSecret();
  const phone = normalizeUsPhone(expectedPhone);
  const value = typeof token === "string" ? token.trim() : "";
  const parts = value.split(".");

  if (!secret || parts.length !== 2 || phone.length !== 10) return null;

  const [encodedPayload, signature] = parts;
  if (!safeCompare(signature, sign(encodedPayload, secret))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<IdentityTokenPayload>;

    if (
      payload.phone !== phone ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      payload.issuedAt > now ||
      payload.expiresAt <= now ||
      payload.expiresAt - payload.issuedAt !== IDENTITY_TOKEN_TTL_MS ||
      !payload.result ||
      payload.result.provider !== "twilio"
    ) {
      return null;
    }

    return payload.result as IdentityMatchResult;
  } catch {
    return null;
  }
}
