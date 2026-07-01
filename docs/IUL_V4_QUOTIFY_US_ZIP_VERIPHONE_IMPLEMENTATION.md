# Manual completo de migración: ZIP manual con Zippopotam y teléfonos con Veriphone

> Documento operativo para otro agente Codex que trabaje sobre una copia de este proyecto.
>
> Alcance exclusivo: funnels `/iul-v4` y `/quotify-us`, endpoint compartido de ZIP, endpoint compartido de verificación telefónica y endpoints finales de ambos leads.
>
> Este documento debe tratarse como una especificación de implementación y verificación. No contiene valores secretos reales.

## 1. Objetivo exacto

La copia del proyecto debe terminar con este comportamiento:

1. Los funnels `/iul-v4` y `/quotify-us` siempre solicitan al usuario un ZIP code de cinco dígitos.
2. Estos dos funnels no usan la ubicación de Vercel para completar automáticamente ZIP, ciudad o estado.
3. El ZIP escrito por el usuario se consulta mediante el endpoint interno `/api/zip/[zip]`.
4. Ese endpoint consulta Zippopotam y, cuando recibe `?strict=zippopotam`, no puede recurrir a Vercel ni a un fallback.
5. El estado del lead se obtiene exclusivamente de la respuesta válida de Zippopotam correspondiente al ZIP ingresado.
6. La integración de geolocalización de Vercel no se elimina del proyecto porque otros funnels pueden seguir utilizándola.
7. Las validaciones heurísticas locales del teléfono se eliminan de estos dos funnels y de sus endpoints finales.
8. Un teléfono se acepta únicamente después de una respuesta aprobatoria de Veriphone.
9. Veriphone se consulta una sola vez durante la interacción del usuario.
10. Después de aprobar el teléfono, el servidor entrega un token HMAC temporal.
11. Al guardar el lead, el backend verifica el token y la evidencia; no vuelve a consultar Veriphone.
12. No se alteran el diseño general, tracking existente, TrustedForm, Supabase, webhooks, pay-per-call, páginas de agradecimiento ni bloqueo de New York en IUL-V4.

Flujo final:

```text
Usuario responde edad y objetivo
  → siempre aparece paso ZIP
  → usuario escribe 5 dígitos
  → GET /api/zip/33101?strict=zippopotam
  → Zippopotam devuelve ciudad + estado + ZIP
  → frontend guarda ZIP, ubicación y estado
  → usuario escribe nombre
  → usuario escribe teléfono
  → normalización local sin truncar números inválidos
  → debounce 350 ms
  → POST /api/phone-verify
  → Veriphone valida teléfono, tipo, carrier y país
  → servidor devuelve evidencia + token HMAC por 15 minutos
  → frontend muestra válido y permite continuar/enviar
  → endpoint final recibe teléfono + evidencia + token
  → endpoint final valida todo sin consultar nuevamente a Veriphone
  → guarda en Supabase y continúa el flujo existente
```

## 2. Reglas de trabajo obligatorias para el agente

Antes de modificar la copia:

1. Leer el `AGENTS.md` del repositorio.
2. Confirmar la versión de Next.js desde `package.json`.
3. Leer completamente estas guías locales antes de escribir código:

```text
node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
node_modules/next/dist/docs/01-app/02-guides/environment-variables.md
node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
```

4. Revisar el estado del worktree con `git status --short`.
5. No borrar ni sobrescribir cambios ajenos.
6. No copiar claves reales en archivos versionados, mensajes, logs, screenshots ni resultados de herramientas.
7. Usar `apply_patch` para editar archivos.
8. Reutilizar los componentes, estilos, nombres de eventos y estructura existentes.
9. Mantener `"use client"` en los dos componentes interactivos.
10. Marcar la utilidad que maneja secretos con `import "server-only"`.

## 3. Archivos involucrados

### Archivos nuevos

```text
lib/phone.ts
lib/phone-verification.ts
app/api/phone-verify/route.ts
```

### Archivos modificados

```text
app/api/zip/[zip]/route.ts
app/iul-v4/page.tsx
app/quotify-us/page-client.tsx
app/api/lead-iul-v4/route.ts
app/api/lead-quotify-us/route.ts
```

### Archivos que deben conservarse

No eliminar ni reemplazar:

```text
app/api/location/route.ts
lib/location.ts
lib/infer-us-zip.ts
lib/quotify-us.ts
app/api/lead-token/route.ts
lib/supabase/admin.ts
components/pop-up1.tsx
```

Pueden seguir siendo utilizados por otros funnels. La desactivación de Vercel es específica de `/iul-v4` y `/quotify-us`.

## 4. Variables de entorno

### Variables requeridas

Agregar o confirmar en `.env.local`:

```dotenv
VERIPHONE_API_KEY=VALOR_REAL_ENTREGADO_POR_VERIPHONE
PHONE_VERIFICATION_SECRET=SECRETO_ALEATORIO_DE_AL_MENOS_32_BYTES
```

### Instrucciones estrictas para `.env.local`

1. `.env.local` debe permanecer ignorado por Git.
2. Nunca escribir literalmente `VALOR_REAL_ENTREGADO_POR_VERIPHONE` o `SECRETO_ALEATORIO...` como configuración final.
3. Si `VERIPHONE_API_KEY` ya existe, conservar su valor sin imprimirlo.
4. Si no existe, solicitarlo al usuario o configurarlo mediante el gestor de secretos del despliegue.
5. Generar `PHONE_VERIFICATION_SECRET` con entropía criptográfica; no usar nombres, fechas ni contraseñas humanas.
6. Configurar ambas variables también en Vercel para Development, Preview y Production según corresponda.
7. Ninguna variable debe usar el prefijo `NEXT_PUBLIC_`.
8. Nunca acceder a estas variables desde `app/iul-v4/page.tsx` o `app/quotify-us/page-client.tsx`.

La implementación admite temporalmente `VERIPHONE_API_KEY` como material server-only de respaldo para derivar la firma si `PHONE_VERIFICATION_SECRET` todavía no está configurada. Esto evita romper un despliegue existente, pero la configuración recomendada y definitiva es una variable separada.

### Detección de placeholders

La utilidad server-only debe considerar inválidos secretos vacíos o valores como:

```text
placeholder
your_api_key
replace_me
changeme
veriphone_api_key
```

Si la API key no está configurada correctamente, responder con el flag `veriphone_not_configured` sin intentar llamar al proveedor.

## 5. Normalización compartida del teléfono

Crear `lib/phone.ts`. Este archivo es seguro para servidor y cliente y no contiene secretos.

La función debe ser conceptualmente equivalente a:

```ts
export function normalizeUsPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}
```

Reglas:

- Eliminar espacios, paréntesis, guiones y cualquier carácter no numérico.
- Aceptar diez dígitos nacionales.
- Aceptar once dígitos solamente cuando comienzan con `1`; quitar ese `1`.
- No truncar silenciosamente valores de doce o más dígitos.
- No aceptar once dígitos que comienzan por otro número.
- El valor final guardado en un lead válido debe contener exactamente diez dígitos.

Agregar también un formateador visual:

```ts
export function formatUsPhone(value: unknown): string
```

Debe mostrar un número normal como:

```text
305 555 1234
```

Si existen dígitos sobrantes, deben permanecer visibles para que el usuario pueda corregirlos. Nunca ocultarlos mediante un `slice(0, 10)` silencioso.

## 6. Endpoint ZIP compartido

Archivo:

```text
app/api/zip/[zip]/route.ts
```

La integración existente con Zippopotam debe conservarse:

```text
GET https://api.zippopotam.us/us/{zip}
```

Validar primero que el parámetro cumpla:

```ts
/^\d{5}$/
```

Una respuesta exitosa de Zippopotam debe convertirse a:

```ts
{
  location: "Miami, Florida",
  source: "zippopotam",
  city: "Miami",
  country: "US",
  state: "Florida",
  zipCode: "33101",
  fallback: false
}
```

### Modo estricto

Leer el query parameter:

```ts
const strictZippopotam =
  new URL(request.url).searchParams.get("strict") === "zippopotam";
```

Si Zippopotam no resuelve el ZIP y el modo estricto está activo, responder:

```ts
NextResponse.json(
  { error: "ZIP code not found" },
  { status: 404 },
);
```

La comprobación estricta debe ocurrir antes de:

```ts
buildVercelLocation(geolocation(request))
```

Esto garantiza que las llamadas de estos funnels nunca obtengan estado o ZIP desde la IP.

### Compatibilidad

No eliminar el fallback existente de Vercel para llamadas sin `?strict=zippopotam`. Otros funnels pueden depender de él.

## 7. Criterio para aceptar una respuesta ZIP

En cada frontend, implementar un type guard equivalente a:

```ts
function isResolvedUsZip(
  data: ZipLookupResponse | null,
  requestedZipCode: string,
): data is ZipLookupResponse & {
  state: string;
  zipCode: string;
  source: "zippopotam";
  fallback: false;
} {
  return (
    !!data &&
    data.source === "zippopotam" &&
    data.fallback === false &&
    data.zipCode === requestedZipCode &&
    !!data.state &&
    stateOptions.includes(data.state)
  );
}
```

No aceptar únicamente `response.ok`. También se debe comprobar:

- `source === "zippopotam"`.
- `fallback === false`.
- El ZIP devuelto coincide exactamente con el solicitado.
- Existe estado.
- El estado pertenece a la lista permitida de estados de EE. UU. y District of Columbia.

Todas las consultas de estos dos funnels deben usar:

```ts
fetch(`/api/zip/${zipCode}?strict=zippopotam`, {
  cache: "no-store",
});
```

## 8. Modificación de IUL-V4 para ZIP obligatorio

Archivo:

```text
app/iul-v4/page.tsx
```

### Cambios requeridos

1. No ejecutar `/api/location` para hidratar ZIP o estado.
2. No llamar `inferUsZipFromStateAndPhone`.
3. No utilizar `buildLocationBackup`.
4. Forzar:

```ts
const shouldAskZipCode = true;
```

5. La secuencia visible debe conservar:

```ts
["age", "goal", "state", "name", "phone"]
```

6. El paso llamado internamente `state` continúa siendo el paso visual del ZIP; no es necesario renombrarlo si eso puede afectar tracking o navegación.
7. El input debe:

```tsx
inputMode="numeric"
pattern="[0-9]*"
autoComplete="postal-code"
```

8. Normalizar a máximo cinco dígitos para el ZIP.
9. Deshabilitar el botón mientras no existan cinco dígitos o mientras se consulta.
10. Al confirmar, consultar Zippopotam en modo estricto.
11. Guardar en `answers`:

```ts
{
  zipCode,
  state: data.state,
  detectedState: data.state,
  locationText: data.location
}
```

12. Conservar el bloqueo existente de New York:

```ts
if (isBlockedState(data.state)) {
  rejectByNewYork();
  return;
}
```

13. Antes del envío final, volver a resolver el ZIP con Zippopotam en modo estricto para impedir datos obsoletos o alterados en cliente.
14. El estado final y `locationText` deben reemplazarse con la respuesta fresca de Zippopotam.

### No cambiar en IUL-V4

- Opciones de edad.
- Opciones de objetivo.
- Pantalla de rechazo.
- Cookie de rechazo.
- Tracking de pasos.
- GTM y Meta payloads existentes.
- TrustedForm.
- Flujo pay-per-call.
- Popup final.
- Parámetros UTM.
- Diseño, dimensiones y colores fuera del feedback estrictamente necesario.

## 9. Modificación de Quotify-US para ZIP obligatorio

Archivo:

```text
app/quotify-us/page-client.tsx
```

### Cambios requeridos

1. Mantener el step `location` para no romper progreso ni navegación.
2. Reemplazar la detección automática y selector de estado por un input de ZIP.
3. No llamar `/api/location`.
4. No llamar `getDetectedZipCode`.
5. No generar un ZIP representativo por estado.
6. No usar el fallback `10001`.
7. El usuario debe ingresar obligatoriamente cinco dígitos.
8. Consultar `/api/zip/{zip}?strict=zippopotam`.
9. Guardar ZIP, estado, estado detectado y ubicación exclusivamente desde Zippopotam.
10. En `resolveLocationSnapshot`, volver a validar el ZIP y lanzar error si la respuesta no cumple `isResolvedUsZip`.
11. Si el funnel restaura un borrador de `localStorage`, limpiar:

```ts
state: ""
detectedState: ""
zipCode: ""
locationText: ""
userCityState: ""
```

12. Si el step restaurado era `name`, `phone` o `email`, regresar a `location`. Esto garantiza que una sesión antigua no evite el nuevo requisito.

### Estado visual esperado

- Título: `¿Cuál es tu ZIP code?`
- Placeholder: `00000`.
- Botón: `Confirmar ZIP code`.
- Durante consulta: `Validando ZIP code...`.
- Error de longitud: `Ingresa un ZIP code válido de EE.UU. con 5 dígitos.`.
- Error real: `Ingresa un ZIP code real de EE.UU.`.

Mantener el layout, progreso, anchura del formulario, tipografías, logos y botones existentes.

## 10. Utilidad server-only de Veriphone

Archivo:

```text
lib/phone-verification.ts
```

Debe comenzar con:

```ts
import "server-only";
```

Importar:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeUsPhone } from "@/lib/phone";
```

### Constantes

```ts
const VERIPHONE_TIMEOUT_MS = 3500;
const PHONE_TOKEN_TTL_MS = 15 * 60 * 1000;
const allowedPhoneTypes = new Set([
  "mobile",
  "fixed_line",
  "fixed_line_or_mobile",
]);
```

### Solicitud externa exacta

```text
GET https://api.veriphone.io/v2/verify?phone=%2B13055551234
Authorization: Bearer VERIPHONE_API_KEY
```

Implementar mediante:

```ts
fetch(
  `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(`+1${normalized}`)}`,
  {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
    signal: controller.signal,
  },
);
```

Nunca agregar la API key al query string. La implementación antigua `app/api/lead-v4-veri/route.ts` puede servir como referencia histórica, pero no debe copiarse literalmente porque usa un contrato distinto y consulta durante el envío.

### Manejo de errores

Capturar sin propagar:

- Timeout.
- DNS o red.
- Respuesta HTTP no exitosa.
- JSON inválido.
- Respuesta vacía.
- API key ausente o placeholder.

Usar razones seguras:

```text
No pudimos verificar el número ahora mismo. Intenta nuevamente.
Ingresa un número móvil o fijo contactable.
Ingresa un número contactable de 10 dígitos.
```

No devolver mensajes internos, stack traces, URL con credenciales ni cuerpo crudo del proveedor.

## 11. Criterios estrictos de aceptación de Veriphone

El teléfono se aprueba únicamente si se cumplen todas estas condiciones:

```ts
data.phone_valid === true
```

El tipo normalizado a minúsculas es uno de:

```text
mobile
fixed_line
fixed_line_or_mobile
```

Además:

- `carrier` existe.
- `carrier.trim()` no está vacío.
- `carrier.toLowerCase()` no es `unknown`.
- `country_code.toUpperCase()` es `US`, o `country.toLowerCase()` es `united states`.

No permitir VoIP si Veriphone devuelve un tipo distinto de los tres permitidos.

### Flags de diagnóstico

```text
invalid_length
veriphone_not_configured
veriphone_request_failed
veriphone_invalid_phone
veriphone_disallowed_phone_type
veriphone_unknown_carrier
veriphone_not_us
```

La evidencia que puede viajar al cliente debe estar sanitizada:

```ts
type PhoneVerificationEvidence = {
  normalized: string;
  phoneValid: true;
  phoneType: "mobile" | "fixed_line" | "fixed_line_or_mobile";
  carrier: string;
  countryCode: string;
  country: string;
  e164: string;
  phoneRegion: string;
};
```

No enviar la API key, headers del proveedor ni datos innecesarios.

## 12. Token HMAC de verificación

### Payload

```ts
type PhoneVerificationTokenPayload = {
  normalized: string;
  issuedAt: number;
  expiresAt: number;
};
```

### Formato

```text
base64url(JSON.stringify(payload)).base64url(HMAC_SHA256)
```

### Firma

```ts
createHmac("sha256", secret)
  .update(encodedPayload)
  .digest("base64url");
```

Aplicar separación de dominio al secreto:

```text
best-life:phone-verification:v1:{secret}
```

### Validación obligatoria

Comprobar:

1. El token es string no vacío.
2. Tiene exactamente dos partes separadas por punto.
3. Existe secreto server-only.
4. La firma coincide usando `timingSafeEqual`.
5. El JSON puede decodificarse.
6. `normalized` coincide exactamente con el teléfono enviado.
7. `issuedAt` y `expiresAt` son números.
8. `issuedAt <= now`.
9. `expiresAt > now`.
10. La diferencia exacta es quince minutos.

Rechazar tokens:

- Vacíos.
- Modificados.
- Vencidos.
- Con firma inválida.
- De otro teléfono.
- Con payload malformado.

## 13. Endpoint interno `/api/phone-verify`

Archivo:

```text
app/api/phone-verify/route.ts
```

Solo exportar `POST`.

### Validación de origen

```ts
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
```

Origen inválido:

```json
HTTP 403
{ "error": "Forbidden" }
```

### Request

```http
POST /api/phone-verify
Content-Type: application/json

{
  "phone": "3055551234"
}
```

Leer JSON mediante:

```ts
const body = await request.json().catch(() => null);
```

### Response estándar

```ts
{
  ok: boolean;
  normalized: string;
  reason: string | null;
  flags: string[];
  veriphone: PhoneVerificationEvidence | null;
  verificationToken: string | null;
}
```

### Códigos HTTP

- `200`: aprobado y token creado.
- `422`: número o resultado de Veriphone inválido.
- `502`: fallo o respuesta inválida del proveedor.
- `503`: configuración ausente.
- `403`: Origin y Host no coinciden.

Solo generar token cuando Veriphone aprueba. Si no puede generarse token, `ok` debe ser `false`.

## 14. Integración frontend de Veriphone

Aplicar en:

```text
app/iul-v4/page.tsx
app/quotify-us/page-client.tsx
```

### Estados

```ts
type PhoneValidationStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid";
```

Guardar también:

```ts
const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
const [phoneVerification, setPhoneVerification] =
  useState<PhoneVerificationEvidence | null>(null);
const [hasBlurredPhone, setHasBlurredPhone] = useState(false);
```

Refs requeridos:

```ts
const phoneValidationTimeoutRef = useRef<number | null>(null);
const phoneValidationRequestRef = useRef(0);
const phoneValidationAbortRef = useRef<AbortController | null>(null);
```

### Cada cambio del input debe hacer inmediatamente

```ts
phoneValidationRequestRef.current += 1;
phoneValidationAbortRef.current?.abort();

if (phoneValidationTimeoutRef.current !== null) {
  window.clearTimeout(phoneValidationTimeoutRef.current);
  phoneValidationTimeoutRef.current = null;
}

setPhoneValidationStatus("idle");
setPhoneVerification(null);
setPhoneVerificationToken("");
setPhoneError("");
```

Después guardar el teléfono mediante `normalizeUsPhone`.

Esto evita que una respuesta antigua apruebe un número que el usuario ya cambió.

### Teléfono incompleto

- Vacío: `idle`, sin error.
- Entre uno y nueve dígitos antes de blur: `idle`.
- Entre uno y nueve dígitos después de blur: `invalid`.
- Más de diez dígitos normalizados: `invalid` inmediatamente.
- Mensaje: `Ingresa un número contactable de 10 dígitos.`.

No consultar Veriphone si la longitud no es exactamente diez.

### Debounce y concurrencia

Cuando existan exactamente diez dígitos:

1. Estado `validating`.
2. Esperar 350 ms.
3. Crear `AbortController`.
4. Incrementar o capturar un request ID.
5. Enviar `POST /api/phone-verify`.
6. Ignorar cualquier respuesta cuyo request ID ya no sea el actual.
7. Ignorar respuestas de una solicitud abortada.
8. En cleanup, cancelar timeout.
9. En unmount, abortar la solicitud.

### Estado válido

Solo marcar `valid` cuando:

```ts
response.ok
result.ok === true
result.normalized === normalizedPhone
result.veriphone existe
result.verificationToken existe
```

Guardar evidencia y token. Mostrar borde verde y check.

### Estado inválido

Vaciar evidencia y token. Mostrar borde rojo, X y `result.reason`.

Si falla la red:

```text
No pudimos verificar el número ahora mismo. Intenta nuevamente.
```

### Accesibilidad

El input debe mantener:

```tsx
inputMode="tel"
autoComplete="tel"
aria-invalid={status === "invalid" || !!phoneError}
aria-describedby="...mensaje..."
aria-busy={status === "validating"}
```

El error debe usar `role="alert"`. El spinner debe tener texto accesible o `aria-label`.

### Botones

Deshabilitar el botón de continuar o enviar cuando:

```ts
phoneValidationStatus !== "valid"
```

También mantener las condiciones existentes, como `isSubmitting`.

## 15. Analítica y privacidad

Si el funnel ya dispone de GTM/dataLayer, registrar:

```text
phone_verification_started
phone_verification_passed
phone_verification_failed
```

Campos permitidos:

```text
funnel_id
phone_type
carrier
country_code
validation_reason
```

No enviar:

- Teléfono completo.
- Token HMAC.
- API key.
- Payload crudo del proveedor.
- Headers de autorización.

Usar el mecanismo existente de cada funnel:

- IUL-V4: `pushGtmEvent`.
- Quotify-US: `pushToDataLayer`.

## 16. Payload final del frontend

El teléfono normalizado permanece en `answers`:

```ts
answers: {
  phoneNumber: normalizedPhone,
  // conservar todos los demás campos existentes
}
```

Agregar a `meta` sin eliminar nada existente:

```ts
meta: {
  deviceId,
  trustedFormCertUrl,
  salePath,
  adaccountName,
  leadUrl,
  phoneVerification,
  phoneVerificationToken,
}
```

Ejemplo conceptual completo:

```json
{
  "page": "/iul-v4",
  "answers": {
    "ageGroup": "35 a 44",
    "insuranceGoal": "Ahorrar e invertir",
    "state": "Florida",
    "firstName": "Ana",
    "lastName": "Pérez",
    "phoneNumber": "3055551234",
    "email": "ana@example.com",
    "locationText": "Miami, Florida",
    "zipCode": "33101"
  },
  "meta": {
    "deviceId": "bm_...",
    "trustedFormCertUrl": "https://cert.trustedform.com/...",
    "salePath": "lead",
    "adaccountName": "...",
    "leadUrl": "https://dominio/...?utm_source=...",
    "phoneVerification": {
      "normalized": "3055551234",
      "phoneValid": true,
      "phoneType": "mobile",
      "carrier": "Example Carrier",
      "countryCode": "US",
      "country": "United States",
      "e164": "+13055551234",
      "phoneRegion": "Florida"
    },
    "phoneVerificationToken": "PAYLOAD_BASE64URL.FIRMA_BASE64URL"
  }
}
```

El ejemplo usa valores ficticios. Nunca documentar un token o certificado real capturado de producción.

## 17. Validación en endpoints finales

Archivos:

```text
app/api/lead-iul-v4/route.ts
app/api/lead-quotify-us/route.ts
```

### Extender `LeadPayload.meta`

```ts
phoneVerification?: unknown;
phoneVerificationToken?: string;
```

### Reemplazar la validación heurística

Eliminar las funciones locales relacionadas con:

```text
invalid_nanp
service_code_pattern
fictional_555
sequential_digits
repeating_digits
too_many_zeros
synthetic_tail
```

No deben decidir la validez final.

Importar:

```ts
import { validateLeadPhoneVerification } from "@/lib/phone-verification";
```

Validar:

```ts
const phoneValidation = validateLeadPhoneVerification({
  phone: body.answers.phoneNumber,
  verificationToken: body.meta?.phoneVerificationToken,
  verification: body.meta?.phoneVerification,
});
```

El validador final debe comprobar:

- Longitud exacta de diez dígitos.
- Evidencia presente.
- `phoneValid === true`.
- Tipo permitido.
- Carrier presente y distinto de `unknown`.
- País estadounidense.
- Evidencia asociada al mismo teléfono.
- Token presente.
- Firma válida.
- Token vigente.
- Token asociado al mismo teléfono.

Flags finales:

```text
invalid_length
veriphone_missing_result
veriphone_phone_mismatch
veriphone_missing_or_expired_token
```

Si falla:

```json
HTTP 422
{
  "error": "No pudimos confirmar la verificación del teléfono.",
  "riskFlags": ["..."]
}
```

No llamar Veriphone desde los endpoints finales.

### Preservar controles existentes

Antes de procesar el lead deben continuar:

- Validación Origin/Host.
- `x-lead-token` coincidente con cookie.
- Limpieza del payload.
- Conteo de teléfono duplicado.
- Velocidad por IP.
- Velocidad por device ID.
- Inserción Supabase.
- Metadata.
- TrustedForm claim.
- Webhooks.
- CAPI/eventos existentes.
- Eliminación de cookie de lead token al finalizar.

### Metadata interna recomendada

Añadir al bloque de validación del lead:

```ts
phoneProvider: "veriphone",
phoneType: phoneValidation.evidence?.phoneType,
phoneCarrier: phoneValidation.evidence?.carrier,
phoneRegion: phoneValidation.evidence?.phoneRegion,
```

No guardar `phoneVerificationToken` en Supabase, webhooks o analítica salvo que exista una razón explícita. Es una credencial temporal, no un dato comercial.

## 18. Qué no se debe cambiar

Para minimizar regresiones, no modificar:

1. Nombres públicos de rutas existentes.
2. Nombres de tablas Supabase.
3. Campos existentes de Supabase.
4. Formato de `lead_id`.
5. Lógica de `salePath`.
6. Horarios pay-per-call.
7. Ringba.
8. URLs de thanks pages.
9. TrustedForm.
10. UTM/sub IDs.
11. GTM existente, salvo añadir los tres eventos telefónicos.
12. Consent language.
13. Copy legal.
14. CSS general, anchos, alturas y estructura de tarjetas.
15. Otros funnels.
16. `/api/location` global.
17. El comportamiento no estricto de `/api/zip/[zip]`.
18. La API key real.

## 19. Verificación técnica obligatoria

### Lint enfocado

```powershell
npx eslint `
  lib\phone.ts `
  lib\phone-verification.ts `
  app\api\phone-verify\route.ts `
  app\api\lead-iul-v4\route.ts `
  app\api\lead-quotify-us\route.ts `
  app\iul-v4\page.tsx `
  app\quotify-us\page-client.tsx
```

### Build

```powershell
npm run build
```

Si el build compila pero el type-check falla por un archivo obsoleto dentro de `.next/dev/types`, comprobar si referencia una ruta eliminada ajena a esta tarea. En esta versión del proyecto existe el antecedente:

```text
.next/dev/types/validator.ts
Cannot find module '../../../app/iul-v6/page.js'
```

No crear una ruta falsa ni modificar código funcional para satisfacer una caché obsoleta. Regenerar la caché en un entorno limpio o reportar el bloqueo con precisión.

### Búsquedas de seguridad

Confirmar que los componentes cliente no contienen secretos:

```powershell
rg -n "VERIPHONE_API_KEY|PHONE_VERIFICATION_SECRET" `
  app\iul-v4 app\quotify-us components public
```

La búsqueda debe producir cero coincidencias.

Confirmar que no permanecen heurísticas antiguas en los dos funnels:

```powershell
rg -n "getPhoneValidationMessage|phoneErrorMessage|invalid_nanp|fictional_555|sequential_digits" `
  app\iul-v4\page.tsx `
  app\quotify-us\page-client.tsx `
  app\api\lead-iul-v4\route.ts `
  app\api\lead-quotify-us\route.ts
```

Confirmar modo estricto ZIP:

```powershell
rg -n "strict=zippopotam|strictZippopotam" `
  app\api\zip\[zip]\route.ts `
  app\iul-v4\page.tsx `
  app\quotify-us\page-client.tsx
```

### Diff

```powershell
git diff --check
git status --short
git diff --stat
```

No resolver advertencias de archivos ajenos si eso amplía el alcance.

## 20. Validación funcional de aceptación

Realizar en ambos funnels:

### ZIP

1. Abrir en ventana limpia.
2. Confirmar que el paso ZIP siempre aparece.
3. Confirmar que no aparece ubicación detectada por IP.
4. Probar cuatro dígitos: botón deshabilitado.
5. Probar ZIP inexistente: mostrar error y no avanzar.
6. Probar ZIP real: avanzar y guardar estado correcto.
7. Probar ZIP de New York en IUL-V4: debe conservar el rechazo existente.
8. Recargar Quotify con borrador antiguo: debe volver al paso de ubicación y pedir ZIP.

### Teléfono

1. Campo vacío: borde neutral, sin icono.
2. Escribir menos de diez dígitos y hacer blur: error rojo.
3. Escribir diez dígitos: spinner después del debounce.
4. Proveedor aprueba: borde verde y check.
5. Proveedor rechaza: borde rojo, X y razón segura.
6. Cambiar un dígito después de aprobado: borrar inmediatamente aprobación y token.
7. Confirmar que botón queda deshabilitado durante validación e invalidez.
8. Confirmar que un teléfono con prefijo `1` se normaliza correctamente.
9. Confirmar que más de once dígitos no se ocultan ni aceptan.
10. Confirmar que el diseño no salta ni cambia de anchura.

### Envío final

1. Envío normal aprobado: lead guardado una sola vez.
2. Quitar token desde DevTools: HTTP 422.
3. Alterar token: HTTP 422.
4. Cambiar `answers.phoneNumber` dejando token anterior: HTTP 422.
5. Cambiar evidencia: HTTP 422 si deja de cumplir criterios.
6. Confirmar que el endpoint final no genera una segunda llamada a Veriphone.
7. Confirmar que TrustedForm, Supabase, webhooks y thanks page continúan.

## 21. Criterios de finalización

La tarea solamente está terminada cuando se cumple todo lo siguiente:

- [ ] Ambos funnels siempre muestran el paso ZIP.
- [ ] Ninguno de los dos consulta `/api/location` para completar ubicación.
- [ ] Estado y ciudad provienen de Zippopotam.
- [ ] El modo estricto nunca cae en Vercel.
- [ ] New York continúa bloqueado en IUL-V4.
- [ ] La API key no aparece en el bundle cliente.
- [ ] El teléfono no se trunca silenciosamente.
- [ ] Solo se consulta Veriphone con diez dígitos.
- [ ] Debounce exacto de 350 ms.
- [ ] Solicitudes antiguas se abortan e invalidan.
- [ ] Solo se aceptan tipos permitidos.
- [ ] Carrier vacío o `unknown` se rechaza.
- [ ] País no estadounidense se rechaza.
- [ ] Token firmado dura quince minutos.
- [ ] Backend final valida token, teléfono y evidencia.
- [ ] Backend final no vuelve a consultar Veriphone.
- [ ] Payload conserva todos los campos anteriores.
- [ ] Tracking no contiene teléfono completo, API key ni token.
- [ ] Lint no tiene errores.
- [ ] Build compila.
- [ ] Cualquier bloqueo preexistente queda documentado con evidencia.

## 22. Entrega esperada del agente

El agente que replique esta implementación debe informar:

1. Lista exacta de archivos creados y modificados.
2. Resumen del flujo ZIP.
3. Resumen del flujo Veriphone.
4. Variables configuradas, sin revelar valores.
5. Confirmación de que no se exponen secretos al cliente.
6. Resultado de lint.
7. Resultado de build.
8. Advertencias preexistentes no relacionadas.
9. Diferencias necesarias si la copia diverge de esta estructura.

No afirmar que “todo funciona” sin ejecutar las verificaciones. No ocultar fallos de infraestructura o cachés generadas. No convertir un error externo en cambios innecesarios sobre el producto.
