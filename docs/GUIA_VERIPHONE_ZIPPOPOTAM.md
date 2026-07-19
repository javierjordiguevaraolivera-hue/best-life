# Guía portátil: validación telefónica con Veriphone y ZIP con Zippopotam

Esta guía describe solamente la lógica que debe trasladarse a otro proyecto. No depende de nombres de funnels, rutas comerciales ni estructura visual específica.

## 1. Objetivo

Reemplazar la validación local basada en reglas NANP por una verificación real con Veriphone.

La validación NANP anterior puede comprobar longitud, prefijos o patrones, pero no demuestra que el teléfono sea contactable. Debe dejar de ser la autoridad que decide si el número es válido.

El nuevo flujo es:

```text
Usuario escribe teléfono
  → normalización local
  → cuando existen exactamente 10 dígitos, esperar 350 ms
  → POST a un endpoint interno del proyecto
  → el endpoint interno consulta Veriphone
  → Veriphone devuelve información del número
  → el servidor aplica los criterios de aceptación
  → si es válido, devuelve evidencia y un token firmado temporal
  → el frontend permite continuar
  → al enviar el lead, el backend valida el token sin consultar nuevamente Veriphone
```

## 2. Variables de entorno

Guardar únicamente en variables de servidor:

```dotenv
VERIPHONE_API_KEY=CLAVE_REAL_DE_VERIPHONE
PHONE_VERIFICATION_SECRET=SECRETO_ALEATORIO_DE_AL_MENOS_32_BYTES
```

Reglas:

- No usar prefijo `NEXT_PUBLIC_`.
- No leer estas variables desde componentes cliente.
- No enviar sus valores al navegador.
- No escribir sus valores en logs.
- No guardar valores de ejemplo o placeholders en producción.
- `PHONE_VERIFICATION_SECRET` debe ser diferente de la API key.
- Si se necesita compatibilidad temporal, puede derivarse el secreto de firma desde la API key únicamente en servidor, pero se recomienda configurar la variable separada.

## 3. Normalización del teléfono

Usar una sola función compartida:

```ts
export function normalizeUsPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}
```

Comportamiento:

- `(305) 555-1234` se convierte en `3055551234`.
- `1 305 555 1234` se convierte en `3055551234`.
- Diez dígitos se conservan.
- Once dígitos que no comienzan por `1` son inválidos.
- Más de once dígitos son inválidos.
- No truncar silenciosamente números largos.
- El número aceptado y guardado debe tener exactamente diez dígitos.

Para mostrarlo en pantalla se puede usar:

```text
US +1   305 555 1234
```

## 4. Solicitud del frontend al endpoint interno

El navegador nunca consulta directamente a Veriphone.

Cuando el teléfono normalizado tenga exactamente diez dígitos, esperar 350 ms y enviar:

```http
POST /api/phone-verify
Content-Type: application/json

{
  "phone": "3055551234"
}
```

El nombre de la ruta interna puede adaptarse al proyecto.

### Timing y concurrencia

- Debounce: `350 ms`.
- Timeout recomendado para Veriphone: `3500 ms`.
- Vigencia del token: `15 minutos`.
- Cancelar el timeout anterior si el usuario continúa escribiendo.
- Abortar la solicitud anterior mediante `AbortController` cuando cambie el teléfono.
- Usar un request ID incremental para ignorar respuestas antiguas.
- Cada cambio debe borrar inmediatamente cualquier aprobación, token o evidencia anterior.
- Deshabilitar el botón mientras el estado sea `validating` o `invalid`.

Estados recomendados:

```ts
type PhoneValidationStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid";
```

## 5. Endpoint interno de verificación

El endpoint debe aceptar exclusivamente `POST`.

Antes de procesar:

1. Comparar los headers `Origin` y `Host`.
2. Rechazar con `403` cuando no correspondan al mismo sitio.
3. Leer JSON de forma segura.
4. Normalizar `body.phone`.
5. Rechazar si no contiene exactamente diez dígitos.
6. Leer `VERIPHONE_API_KEY` únicamente en servidor.
7. Rechazar una clave vacía o con placeholder sin llamar al proveedor.

Ejemplo de validación de origen:

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

## 6. Solicitud exacta a Veriphone

Construir el número en formato E.164 agregando `+1` al teléfono nacional normalizado.

Ejemplo:

```text
3055551234 → +13055551234
```

Solicitud:

```http
GET https://api.veriphone.io/v2/verify?phone=%2B13055551234
Authorization: Bearer VERIPHONE_API_KEY
```

Implementación:

```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 3500);

try {
  const response = await fetch(
    `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(`+1${normalized}`)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    },
  );

  // Procesar response.
} finally {
  clearTimeout(timeoutId);
}
```

La API key debe enviarse en `Authorization: Bearer`. No colocarla en el query string.

## 7. Respuesta esperada de Veriphone

Los campos utilizados son:

```ts
type VeriphoneResponse = {
  status?: string;
  phone_valid?: boolean;
  phone_type?: string;
  phone_region?: string;
  country?: string;
  country_code?: string;
  e164?: string;
  carrier?: string;
};
```

Ejemplo conceptual:

```json
{
  "status": "success",
  "phone_valid": true,
  "phone_type": "mobile",
  "phone_region": "Florida",
  "country": "United States",
  "country_code": "US",
  "e164": "+13055551234",
  "carrier": "Example Carrier"
}
```

No confiar únicamente en `status: "success"`. La aplicación debe evaluar todos los criterios siguientes.

## 8. Lógica para determinar si el teléfono es válido

El teléfono es válido únicamente cuando todas estas condiciones son verdaderas:

### Validez del proveedor

```ts
data.phone_valid === true
```

### Tipo permitido

Normalizar `phone_type` a minúsculas y aceptar solamente:

```text
mobile
fixed_line
fixed_line_or_mobile
```

Cualquier otro tipo se rechaza. Esto incluye VoIP cuando Veriphone lo devuelve con un tipo diferente.

### Carrier

Debe cumplirse:

```ts
carrier.trim() !== ""
carrier.trim().toLowerCase() !== "unknown"
```

### País

Debe cumplirse al menos una condición:

```ts
country_code.trim().toUpperCase() === "US"
```

o:

```ts
country.trim().toLowerCase() === "united states"
```

### Implementación resumida

```ts
const allowedPhoneTypes = new Set([
  "mobile",
  "fixed_line",
  "fixed_line_or_mobile",
]);

const phoneType = String(data.phone_type || "").trim().toLowerCase();
const carrier = String(data.carrier || "").trim();
const countryCode = String(data.country_code || "").trim().toUpperCase();
const country = String(data.country || "").trim().toLowerCase();

const isValid =
  data.phone_valid === true &&
  allowedPhoneTypes.has(phoneType) &&
  carrier !== "" &&
  carrier.toLowerCase() !== "unknown" &&
  (countryCode === "US" || country === "united states");
```

## 9. Flags y mensajes

Flags recomendados:

```text
invalid_length
veriphone_not_configured
veriphone_request_failed
veriphone_invalid_phone
veriphone_disallowed_phone_type
veriphone_unknown_carrier
veriphone_not_us
```

Mensajes seguros para el usuario:

```text
Ingresa un número contactable de 10 dígitos.
Ingresa un número móvil o fijo contactable.
No pudimos verificar el número ahora mismo. Intenta nuevamente.
```

No mostrar errores internos, cuerpos crudos del proveedor ni stack traces.

## 10. Respuesta del endpoint interno

Contrato recomendado:

```ts
{
  ok: boolean;
  normalized: string;
  reason: string | null;
  flags: string[];
  veriphone: {
    normalized: string;
    phoneValid: true;
    phoneType: "mobile" | "fixed_line" | "fixed_line_or_mobile";
    carrier: string;
    countryCode: string;
    country: string;
    e164: string;
    phoneRegion: string;
  } | null;
  verificationToken: string | null;
}
```

Códigos HTTP:

- `200`: número aprobado y token generado.
- `422`: teléfono o resultado inválido.
- `502`: error, timeout o respuesta inválida de Veriphone.
- `503`: API key o secreto no configurado.
- `403`: origen no permitido.

## 11. Token firmado

Cuando Veriphone aprueba el teléfono, generar un token HMAC-SHA256.

Payload:

```ts
type PhoneVerificationTokenPayload = {
  normalized: string;
  issuedAt: number;
  expiresAt: number;
};
```

Vigencia:

```ts
const expiresAt = issuedAt + 15 * 60 * 1000;
```

Formato:

```text
base64url(payload JSON).base64url(firma HMAC-SHA256)
```

Validar mediante comparación de tiempo constante:

```ts
timingSafeEqual(receivedSignature, expectedSignature)
```

El token debe rechazarse cuando:

- Está vacío.
- Fue alterado.
- Está vencido.
- La firma no coincide.
- Pertenece a otro teléfono.
- Su estructura no es válida.

## 12. Payload del envío final

El frontend debe enviar el teléfono normalizado en los datos del lead y agregar evidencia y token en metadata.

```json
{
  "answers": {
    "phoneNumber": "3055551234"
  },
  "meta": {
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

Estos valores son ilustrativos.

El endpoint final debe comprobar:

1. El teléfono normalizado tiene exactamente diez dígitos.
2. Existe evidencia.
3. La evidencia indica `phoneValid: true`.
4. El tipo, carrier y país siguen cumpliendo los criterios.
5. El teléfono de la evidencia coincide con el enviado.
6. Existe token.
7. La firma es auténtica.
8. El token no venció.
9. El teléfono del token coincide con el enviado.

Si alguna condición falla, responder `422`.

No volver a consultar Veriphone durante el envío final. El token demuestra que el servidor ya aprobó ese número.

## 13. Qué hacer con la validación NANP existente

Desactivar o eliminar como autoridad final reglas locales como:

```text
invalid_nanp
service_code_pattern
fictional_555
sequential_digits
repeating_digits
too_many_zeros
synthetic_tail
```

La interfaz puede conservar normalización, formato visual y comprobación de longitud. No debe aprobar un teléfono basándose solamente en expresiones regulares NANP.

El backend tampoco debe aceptar un lead solamente porque cumple el patrón NANP. La autoridad final es la evidencia aprobada por Veriphone más el token válido.

## 14. ZIP: cómo pausar la ubicación automática

No es necesario eliminar la integración de geolocalización existente. Se debe pausar únicamente en los flujos que necesitan que el usuario escriba el ZIP.

Comportamiento:

```text
Siempre mostrar campo ZIP
  → usuario escribe 5 dígitos
  → endpoint interno consulta Zippopotam
  → estado y ciudad se obtienen de Zippopotam
  → no usar ZIP ni estado derivados de IP
```

Consulta externa:

```http
GET https://api.zippopotam.us/us/33101
```

Respuesta interna esperada:

```json
{
  "location": "Miami, Florida",
  "source": "zippopotam",
  "city": "Miami",
  "country": "US",
  "state": "Florida",
  "zipCode": "33101",
  "fallback": false
}
```

## 15. Modo estricto para Zippopotam

Si el endpoint de ZIP normalmente usa geolocalización por IP como fallback, agregar un modo estricto:

```http
GET /api/zip/33101?strict=zippopotam
```

Leerlo con:

```ts
const strictZippopotam =
  new URL(request.url).searchParams.get("strict") === "zippopotam";
```

Después de intentar Zippopotam:

```ts
if (zipLocation) {
  return NextResponse.json(zipLocation);
}

if (strictZippopotam) {
  return NextResponse.json(
    { error: "ZIP code not found" },
    { status: 404 },
  );
}

// Solo aquí puede continuar el fallback por IP para otros flujos.
```

Así se conserva la geolocalización para otras partes del proyecto, pero el flujo que usa `strict=zippopotam` nunca obtiene estado o ZIP desde Vercel/IP.

## 16. Criterios para aceptar el ZIP

Aceptar solamente cuando:

```ts
data.source === "zippopotam" &&
data.fallback === false &&
data.zipCode === requestedZipCode &&
typeof data.state === "string" &&
data.state.length > 0
```

Además:

- El ZIP ingresado debe cumplir `/^\d{5}$/`.
- El estado debe pertenecer a la lista de estados admitidos por el producto.
- Si el usuario cambia el ZIP, borrar inmediatamente el estado anterior.
- Antes del envío final, es recomendable confirmar nuevamente el ZIP para impedir datos obsoletos o manipulados.
- No generar ZIP representativos por estado.
- No usar un ZIP genérico como `10001`.

## 17. Qué debe conservarse

Al trasladar esta lógica a otro proyecto, no reemplazar innecesariamente:

- Diseño del formulario.
- Textos legales y consentimiento.
- Tracking existente.
- Captura de UTM y sub IDs.
- TrustedForm u otros certificados.
- Guardado en base de datos.
- Webhooks.
- Lógica de duplicados y velocidad.
- Rutas de agradecimiento.
- Geolocalización utilizada por otros flujos.

Los cambios deben limitarse a quién determina el ZIP/estado y quién tiene autoridad para aprobar el teléfono.
