# Guía: Duplicar `/iul-v4` → `/iul-v4-identity` con verificación Twilio (Identity Match)

> Guía portátil y autosuficiente para replicar en **otro proyecto** (ej. *ProSeguros Info*) lo que ya se hizo en Best Life.
> Está escrita para que "otro yo" (Claude en otro chat) la siga sin contexto previo. Incluye contexto, objetivo, decisiones, código completo y el fix de leads duplicados.

---

## 1. Contexto

El proyecto es un funnel Next.js (App Router) con una página `/iul-v4` que captura leads de seguros. En el paso de teléfono, hoy valida el número con **Veriphone** (comprueba formato + tipo de línea + carrier). Si pasa, emite un **token firmado** (HMAC) que viaja hasta el envío del lead; al enviar, el backend re-valida ese token y guarda el lead en Supabase (tablas `leads` + `lead_metadata`).

Piezas actuales relevantes:

- `app/iul-v4/page.tsx` — la página (cliente). En el paso de teléfono hace `POST /api/phone-verify` con `{ phone }`.
- `app/api/phone-verify/route.ts` — endpoint que llama a Veriphone y emite el token.
- `lib/phone-verification.ts` — lógica Veriphone + token (`createPhoneVerificationToken`, `validateLeadPhoneVerification`, etc.).
- `app/api/lead-iul-v4/route.ts` — guarda el lead: inserta en `leads` y luego en `lead_metadata`, y **re-valida la evidencia + token de Veriphone**.
- `lib/phone.ts` — `normalizeUsPhone`, `formatUsPhone` (se reutiliza tal cual).
- `app/iul-v4/rechazo/page.tsx` — página de "no calificas" (edad 65+ / NY).

---

## 2. Objetivo

Crear una **página duplicada** `/iul-v4-identity`, **idéntica** a `/iul-v4`, cambiando **solo la validación de teléfono**: Veriphone → **Twilio Lookup v2 (Identity Match)**. Twilio, además de validar el número, verifica que **el número esté a nombre de la persona** (compara nombre/apellido contra la línea).

Reglas duras:

- **NO tocar `/iul-v4` ni su API ni sus libs.** Todo lo nuevo se crea aparte.
- **Misma data, mismas tablas, mismo `funnel_id = "iul-v4"`** (la página nueva envía `page: "/iul-v4"`).
- Se **reutiliza** la página de rechazo `/iul-v4/rechazo` (no se duplica).
- En la BD la única diferencia: `validation.phoneProvider = "twilio_identity_match"` y la columna **`veriphone`** de `lead_metadata` guarda el JSON crudo de Twilio.

---

## 3. Por qué se creó una API nueva (no solo se duplicó el front)

Es la decisión clave. Razones:

1. **El API original `/api/lead-iul-v4` está "casado" con Veriphone.** Re-valida el token + evidencia con `validateLeadPhoneVerification` (verifica `phoneType/carrier/country` estilo Veriphone). Un lead verificado por **Twilio** tiene otra forma de evidencia y otro token (otra sal HMAC), así que **el API original lo rechazaría**. No hay forma de reutilizarlo tal cual.

2. **No se puede tocar el original** (está en producción). Modificarlo arriesga el funnel que ya funciona.

Por eso se crea un **API paralelo** `/api/lead-iul-v4-identity` (copia del original) que valida el token de identidad de Twilio y escribe en **las mismas tablas y columnas** (la data guardada es idéntica). Igual se necesita:

- Un **endpoint de verificación nuevo** `/api/identity-verify`, porque el paso de teléfono ahora debe mandar **nombre + ciudad + estado + ZIP** a Twilio (Veriphone solo necesitaba el teléfono). Devuelve un token firmado que **lleva dentro** el resultado de la verificación.
- Una **librería nueva** `lib/identity-match.ts` (llamada a Twilio + regla de aprobación + token). No se toca `lib/phone-verification.ts`.

> Nota importante: la página es **cliente** (`"use client"`). NO importes tipos desde `lib/identity-match.ts` (tiene `import "server-only"` y rompería el build del cliente). Define los tipos que necesite la página **inline** dentro de la propia página.

---

## 4. Variables de entorno

Twilio Identity Match usa las credenciales normales de Twilio. Agregar en `.env.local` (local) **y en Vercel** (producción):

```bash
TWILIO_ACCOUNT_SID=AC...        # o una API Key SK... con permiso de Lookup
TWILIO_AUTH_TOKEN=...           # auth token de la cuenta (o el secret de la API Key)
# Opcional pero recomendado (para firmar el token). Si NO se pone, cae a TWILIO_AUTH_TOKEN:
PHONE_VERIFICATION_SECRET=algo-largo-y-secreto
```

- Veriphone (`VERIPHONE_API_KEY`) **se queda** intacto para el funnel original.
- ⚠️ **Sin credenciales Twilio + secreto, el paso de teléfono da 500** (no puede firmar el token). Es el diseño de seguridad: sin secreto no se emiten tokens de confianza.
- Costo Twilio: ~$0.03–0.05 por lookup con `identity_match`. Solo se llama una vez por número.

---

## 5. Archivos que se crean (nada del original se toca)

```
app/iul-v4-identity/page.tsx            (copia de app/iul-v4/page.tsx + cambios de cliente)
app/api/identity-verify/route.ts        (NUEVO)
app/api/lead-iul-v4-identity/route.ts   (copia de app/api/lead-iul-v4/route.ts + cambios)
lib/identity-match.ts                   (NUEVO)
```

La página de rechazo se **reutiliza** (`/iul-v4/rechazo`), no se duplica.

---

## 6. Paso a paso

### Paso 0 — Copiar los archivos base

```bash
mkdir -p app/iul-v4-identity app/api/lead-iul-v4-identity app/api/identity-verify
cp app/iul-v4/page.tsx            app/iul-v4-identity/page.tsx
cp app/api/lead-iul-v4/route.ts  app/api/lead-iul-v4-identity/route.ts
```

Luego se editan las copias. Los dos archivos "NUEVOS" (`lib/identity-match.ts` y `app/api/identity-verify/route.ts`) se crean desde cero con el código de abajo.

---

### Paso 1 — `lib/identity-match.ts` (NUEVO, completo)

Llama a Twilio (sin fecha de nacimiento, sin OTP), aplica la regla de aprobación y firma/valida el token que lleva el resultado dentro.

```ts
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
```

> Si el proyecto usa otro namespace en la sal del token, cambia `best-life:identity-match:v1:` por lo que corresponda. Solo debe ser **consistente** dentro del mismo proyecto.

---

### Paso 2 — `app/api/identity-verify/route.ts` (NUEVO, completo)

Lo llama el paso de teléfono. Convierte el estado (nombre completo → 2 letras), llama a Twilio, evalúa y devuelve `{ ok, normalized, identity, verificationToken }`.

```ts
import { NextResponse } from "next/server";
import {
  createIdentityToken,
  evaluateIdentityVerification,
  matchIdentityWithTwilio,
} from "@/lib/identity-match";
import { normalizeUsPhone } from "@/lib/phone";

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
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
```

---

### Paso 3 — `app/api/lead-iul-v4-identity/route.ts` (copia + cambios)

Partiendo de la copia de `lead-iul-v4/route.ts`, aplica estos cambios:

**3.1 — Imports:** cambia la validación Veriphone por la de identidad y agrega `normalizeUsPhone`.

```diff
- import { validateLeadPhoneVerification } from "@/lib/phone-verification";
+ import { validateIdentityToken } from "@/lib/identity-match";
+ import { normalizeUsPhone } from "@/lib/phone";
```

**3.2 — Tipo del `meta`:** reemplaza los campos de Veriphone por `identityToken`.

```diff
    leadUrl?: string;
-   phoneVerification?: unknown;
-   phoneVerificationToken?: string;
+   identityToken?: string;
  };
```

**3.3 — Validación del teléfono:** el token de identidad **lleva el resultado dentro**, así que `validateIdentityToken` devuelve el resultado o `null`.

```diff
- const phoneValidation = validateLeadPhoneVerification({
-   phone: body.answers.phoneNumber,
-   verificationToken: body.meta?.phoneVerificationToken,
-   verification: body.meta?.phoneVerification,
- });
+ const normalizedPhone = normalizeUsPhone(body.answers.phoneNumber);
+ const identityMatch =
+   normalizedPhone.length === 10
+     ? validateIdentityToken(body.meta?.identityToken, normalizedPhone)
+     : null;
```

**3.4 — Reemplaza todas las referencias a `phoneValidation`:**

- `pruneAndCount(phoneAttempts, phoneValidation.normalized, ...)` → usa `normalizedPhone`.
- `...phoneValidation.flags` → `...(identityMatch?.flags || [])`.
- `if (!phoneValidation.isValid)` → `if (!identityMatch)`.
- `phone_number: phoneValidation.normalized` (insert de `leads`) → `normalizedPhone`.
- `phoneNumber: phoneValidation.normalized` (objeto `lead`) → `normalizedPhone`.
- En el claim de TrustedForm, `phone: phoneValidation.normalized` → `normalizedPhone`.

**3.5 — Objeto `validation` del lead:** provider Twilio + guardar el resultado completo.

```diff
    validation: {
      phoneCountry: "US",
-     phoneProvider: "veriphone",
-     phoneType: phoneValidation.evidence?.phoneType,
-     phoneCarrier: phoneValidation.evidence?.carrier,
-     phoneRegion: phoneValidation.evidence?.phoneRegion,
+     phoneProvider: "twilio_identity_match",
+     phoneType: identityMatch.lineType,
+     phoneCarrier: identityMatch.carrier,
+     identityMatch,
      duplicatePhoneCount,
      ipVelocityCount,
      deviceVelocityCount,
      flags: riskFlags,
    },
```

**3.6 — Columna `veriphone` en la metadata:** guarda el JSON crudo de Twilio. (Ver Paso 4 para la forma final del bloque de metadata, que además arregla los duplicados.)

> `getFunnelId(body.page)` sale de `body.page`. Como la página nueva envía `page: "/iul-v4"`, el `funnel_id` sigue siendo `"iul-v4"`. No cambies eso si quieres mezclar la data con la del funnel original.

---

### Paso 4 — El fix de leads duplicados (parte crítica)

**El problema (comprobado con datos reales):** el guardado eran **dos pasos** — primero `INSERT` en `leads` (éxito), luego `INSERT` en `lead_metadata`. Si el segundo paso fallaba (fallo transitorio ~5% de las veces), el API devolvía **502**, aunque **el lead ya estaba guardado**. El usuario veía "error", **volvía a dar clic ~15-20s después**, y como no había nada que lo detuviera, se creaba un **lead duplicado**. (Ningún lead se perdía: el lead siempre se guarda antes que la metadata.)

**La solución (sin frenar leads, sin perder metadata en el 99%):** responder **éxito apenas se guarda el lead**, y escribir la metadata **en segundo plano con 3 reintentos** usando `waitUntil`. Si aun así falla, se registra y se descarta — **NO se crea ningún lead nuevo**. La metadata es tracking complementario; lo que importa es que el lead llegue.

Reemplaza el bloque original (el `INSERT` de metadata + `if (metadataError) return 502` + el `waitUntil` del TrustedForm) por esto, **después** del `INSERT` de `leads`:

```ts
  const metadataRow = {
    lead_id: data.lead_id,
    application_id: buildApplicationNumber(data.lead_id),
    source: lead.source,
    page: lead.pagina,
    submitted_at: submittedAt,
    ip_address: requestIp,
    geolocation: geo,
    device_id: deviceId || null,
    validation: lead.validation,
    // Payload de identidad de Twilio (columna de texto) para evaluar mas adelante.
    veriphone: JSON.stringify(identityMatch),
    risk_flags: riskFlags,
    adaccount_name: adaccountName || null,
    lead_url: leadUrl || null,
    payload: lead,
  };

  // El lead YA quedo guardado: respondemos exito de inmediato para que el usuario
  // no vea error ni reintente (el reintento era lo que generaba leads duplicados).
  // La metadata es tracking complementario y se escribe "por detras" con reintentos;
  // si aun asi falla, se registra y se descarta -- NO se crea ningun lead nuevo.
  const response = NextResponse.json({
    ok: true,
    saved: true,
    leadId: data?.lead_id ?? null,
  });
  response.cookies.delete(leadTokenCookieName);

  waitUntil(
    (async () => {
      const METADATA_MAX_ATTEMPTS = 3;
      let metadataSaved = false;

      for (let attempt = 1; attempt <= METADATA_MAX_ATTEMPTS; attempt += 1) {
        const { error: metadataError } = await supabase
          .from(metadataTableName)
          .insert(metadataRow);

        if (!metadataError) {
          metadataSaved = true;
          break;
        }

        console.error(
          `Supabase lead metadata insert failed (intento ${attempt}/${METADATA_MAX_ATTEMPTS}, lead ${data.lead_id})`,
          metadataError,
        );

        if (attempt < METADATA_MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
      }

      if (!metadataSaved) {
        console.error(
          `Supabase lead metadata descartada tras ${METADATA_MAX_ATTEMPTS} intentos (el lead ${data.lead_id} SI se guardo)`,
        );
      }

      if (data?.lead_id && trustedFormCertUrl) {
        await claimTrustedFormAndUpdateLead({
          supabase,
          metadataTableName,
          leadId: data.lead_id,
          certUrl: trustedFormCertUrl,
          email: normalizeString(restAnswers.email),
          phone: normalizedPhone,
        });
      }
    })(),
  );

  return response;
}
```

Notas del fix:
- El `INSERT` de `leads` **sí** conserva su `return 502` si falla (ahí el lead no se guardó; reintentar es correcto y no genera duplicado).
- El claim de TrustedForm ahora corre **después** de la metadata, en el mismo proceso de fondo. TrustedForm no depende de la tabla metadata: el certificado (`trustedform_cert_url`) vive en la tabla `leads`, y el claim es una llamada externa que corre igual. La metadata solo guarda la **nota de estado** del claim.
- `waitUntil` viene de `@vercel/functions` (ya importado en el archivo).

---

### Paso 5 — `app/iul-v4-identity/page.tsx` (copia + cambios de cliente)

Partiendo de la copia de `iul-v4/page.tsx`, aplica estos cambios. **No importes nada de `lib/identity-match.ts`** (es server-only): define los tipos inline.

**5.1 — Tipos:** reemplaza los tipos de Veriphone por los de identidad.

```ts
type IdentityMatchResult = {
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

type IdentityVerifyResponse = {
  ok?: boolean;
  normalized?: string;
  reason?: string | null;
  identity?: IdentityMatchResult | null;
  verificationToken?: string | null;
};
```

**5.2 — Estado:** el token de identidad ya lleva la evidencia dentro, así que **no** hace falta guardar la evidencia en el cliente. Se guarda el token + el teléfono verificado (para comparar).

```diff
- const [phoneVerification, setPhoneVerification] = useState<PhoneVerificationEvidence | null>(null);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
+ const [verifiedPhone, setVerifiedPhone] = useState("");
```

(Elimina todas las llamadas a `setPhoneVerification(...)` que queden.)

**5.3 — Efecto de verificación de teléfono:** apunta a `/api/identity-verify` y manda **nombre + ciudad + estado + ZIP**. Versión final:

```tsx
  useEffect(() => {
    if (phoneValidationTimeoutRef.current !== null) {
      window.clearTimeout(phoneValidationTimeoutRef.current);
      phoneValidationTimeoutRef.current = null;
    }
    phoneValidationAbortRef.current?.abort();
    phoneValidationAbortRef.current = null;
    const requestId = ++phoneValidationRequestRef.current;
    setPhoneVerificationToken("");
    setVerifiedPhone("");

    if (normalizedPhone.length !== 10) {
      const shouldShowIncompleteError =
        normalizedPhone.length > 10 || (hasBlurredPhone && normalizedPhone.length > 0);
      setPhoneValidationStatus(shouldShowIncompleteError ? "invalid" : "idle");
      setPhoneError(shouldShowIncompleteError ? "Ingresa un número contactable de 10 dígitos." : "");
      return;
    }

    setPhoneValidationStatus("validating");
    setPhoneError("");
    phoneValidationTimeoutRef.current = window.setTimeout(async () => {
      phoneValidationTimeoutRef.current = null;
      const controller = new AbortController();
      phoneValidationAbortRef.current = controller;
      pushGtmEvent("phone_verification_started", { funnel_id: "iul-v4" });

      try {
        const response = await fetch("/api/identity-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: normalizedPhone,
            firstName: answers.firstName.trim(),
            lastName: answers.lastName.trim(),
            city: (answers.locationText || "").split(",")[0]?.trim() || "",
            state: answers.state,
            zipCode: answers.zipCode,
          }),
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => null)) as IdentityVerifyResponse | null;

        if (requestId !== phoneValidationRequestRef.current || controller.signal.aborted) return;

        if (
          response.ok &&
          result?.ok === true &&
          result.normalized === normalizedPhone &&
          result.verificationToken
        ) {
          setPhoneValidationStatus("valid");
          setPhoneVerificationToken(result.verificationToken);
          setVerifiedPhone(result.normalized);
          setPhoneError("");
          pushGtmEvent("phone_verification_passed", {
            funnel_id: "iul-v4",
            phone_type: result.identity?.lineType ?? undefined,
            carrier: result.identity?.carrier ?? undefined,
          });
          return;
        }

        const reason = result?.reason || "No pudimos verificar el número ahora mismo. Intenta nuevamente.";
        setPhoneValidationStatus("invalid");
        setPhoneError(reason);
        pushGtmEvent("phone_verification_failed", {
          funnel_id: "iul-v4",
          validation_reason: result?.identity?.flags?.join(",") || "request_failed",
        });
      } catch (error) {
        if ((error as Error).name === "AbortError" || requestId !== phoneValidationRequestRef.current) return;
        setPhoneValidationStatus("invalid");
        setPhoneError("No pudimos verificar el número ahora mismo. Intenta nuevamente.");
        pushGtmEvent("phone_verification_failed", {
          funnel_id: "iul-v4",
          validation_reason: "request_failed",
        });
      }
    }, 350);

    return () => {
      if (phoneValidationTimeoutRef.current !== null) {
        window.clearTimeout(phoneValidationTimeoutRef.current);
        phoneValidationTimeoutRef.current = null;
      }
    };
  }, [
    hasBlurredPhone,
    normalizedPhone,
    answers.firstName,
    answers.lastName,
    answers.locationText,
    answers.state,
    answers.zipCode,
  ]);
```

**5.4 — Gate del submit:** el resultado de identidad no tiene `.normalized`, así que se compara con `verifiedPhone`.

```diff
    if (
      phoneValidationStatus !== "valid" ||
-     !phoneVerification ||
      !phoneVerificationToken ||
-     phoneVerification.normalized !== normalizedPhone
+     verifiedPhone !== normalizedPhone
    ) {
      setPhoneError(...);
      return;
    }
```

**5.5 — `fetch` del submit:** apunta al API nuevo y manda `identityToken`. **`page` sigue siendo `"/iul-v4"`.**

```diff
-     const response = await fetch("/api/lead-iul-v4", {
+     const response = await fetch("/api/lead-iul-v4-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lead-token": preparedLeadToken },
        body: JSON.stringify({
          page: "/iul-v4",
          answers: cleanedAnswers,
          meta: {
            deviceId: getOrCreateDeviceId(),
            trustedFormCertUrl: getTrustedFormCertUrl(),
            salePath: shouldUsePayPerCallThankYou ? "call" : "lead",
            adaccountName,
            leadUrl: leadUrlRef.current || window.location.href,
-           phoneVerification,
-           phoneVerificationToken,
+           identityToken: phoneVerificationToken,
          },
        }),
      });
```

**5.6 — Reset en el input de teléfono:** en los handlers `onChange`/`onInput` que resetean la verificación, agrega `setVerifiedPhone("")` (y quita `setPhoneVerification(null)`).

> El resto de la página (runtime-config, PopUp de pay-per-call, ruteo call/lead, /thanks, GTM, TrustedForm, rechazo → `/iul-v4/rechazo`) queda **igual**.

---

## 7. Lógica de aprobación de Twilio (resumen)

| Chequeo | Resultado |
|---|---|
| Número inválido (`phoneValid: false`) | ❌ No pasa |
| No es móvil (fijo/VoIP conocido) | ❌ No pasa |
| Servicio caído / sin credenciales / número válido sin identidad | ✅ Pasa (fail-open, con flag) |
| Nombre **o** apellido con `partial_match` o mejor | ✅ Pasa |
| Nombre **y** apellido ambos `no_match`/sin dato | ❌ No pasa |
| ZIP, ciudad, estado, score bajo | ⚠️ Solo flag, no bloquean |

Filosofía: **el nombre es el filtro fuerte**; lo demás son señales. **Fail-open** a propósito, para no matar ventas por un problema de servicio.

---

## 8. Verificación

```bash
# Typecheck (ignora errores pre-existentes ajenos a estos archivos)
npx tsc --noEmit

# Lint de los archivos nuevos
npx eslint app/iul-v4-identity/page.tsx app/api/lead-iul-v4-identity/route.ts \
  app/api/identity-verify/route.ts lib/identity-match.ts
```

Prueba manual del endpoint (desde la consola del navegador, en el mismo dominio para pasar el chequeo de origin):

```js
fetch("/api/identity-verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "3055551234", firstName: "Test", lastName: "User", city: "Miami", state: "Florida", zipCode: "33101" }),
}).then(r => r.json()).then(console.log);
// Sin credenciales -> 500 (no puede firmar el token). Con credenciales -> 200 { ok:true, verificationToken }.
```

Prueba real de duplicados: envía leads en el funnel nuevo y confirma en Supabase que **no aparecen pares del mismo teléfono con ~15-20s de diferencia**, y que el lead se guarda **una sola vez** con su metadata.

---

## 9. Checklist

- [ ] Env vars `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (y `PHONE_VERIFICATION_SECRET`) en `.env.local` **y en Vercel**.
- [ ] `lib/identity-match.ts` creado.
- [ ] `app/api/identity-verify/route.ts` creado.
- [ ] `app/api/lead-iul-v4-identity/route.ts` creado (copia + cambios 3.1–3.6 + fix del Paso 4).
- [ ] `app/iul-v4-identity/page.tsx` creado (copia + cambios 5.1–5.6).
- [ ] Página de rechazo reutilizada (`/iul-v4/rechazo`).
- [ ] `funnel_id` sigue siendo `"iul-v4"` (la página manda `page: "/iul-v4"`).
- [ ] `tsc` y `eslint` sin errores nuevos.
- [ ] **Original `/iul-v4` y `/api/lead-iul-v4` intactos.**
- [ ] (Recomendado) aplicar también el **fix del Paso 4** al API original `/api/lead-iul-v4` cuando esté validado, para eliminar los duplicados también en el funnel principal.

---

## 10. Notas finales

- **El fix del Paso 4 es independiente de Twilio.** Sirve para cualquier funnel que guarde lead + metadata en dos pasos. Aplícalo también al original y a otros funnels (ej. *pagos-en-vida*) para matar los duplicados.
- **Sin fecha de nacimiento / sin OTP**: este funnel no pide DOB. Si otro funnel sí la pide, se puede añadir `DateOfBirth` (YYYYMMDD) al lookup de Twilio, pero no es necesario aquí.
- **No se hace commit automático**: los cambios se dejan listos para revisión antes de commitear.
