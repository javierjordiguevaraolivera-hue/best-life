// === Pixel de Meta de la landing /ppc ===
// El evento Contact se dispara DIRECTO al pixel desde el navegador, sin pasar
// por Tag Manager ni por la CAPI del servidor.
//
// El pixel ya viene inicializado: PixelScripts (app/pixel-scripts.tsx) monta
// fbq('init', '980723860687387') en toda ruta que no esté en su lista de
// exclusiones, y /ppc y /thank-ppc no lo están. Acá no se inicializa nada: solo
// se dispara. Por eso usamos trackSingle y no track — trackSingle apunta a ESE
// pixel, así que si mañana alguien suma un segundo pixel global, este evento no
// se duplica hacia el otro.
//
// Ojo con el guard: PixelScripts no define fbq cuando la cookie
// bf_age_rejected=true existe (el visitante ya fue descalificado por edad). En
// ese caso esto no hace nada, que es justo lo que queremos.
export const ppcMetaPixelId = "980723860687387";

type FbqParams = Record<string, string | number | boolean | undefined>;

// fbq se tipa acá mismo, como en el resto del sitio (app/call-2, /call-3…), en
// vez de declararlo global: así este archivo no le cambia el tipado a nadie.
type TrackingWindow = Window &
  typeof globalThis & {
    fbq?: (...args: unknown[]) => void;
  };

/** Id único por evento, para deduplicar si algún día se suma la CAPI. */
export function createPpcEventId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Devuelve true solo si el evento llegó a salir. */
export function trackPpcContact(params: FbqParams = {}, eventId?: string) {
  if (typeof window === "undefined") return false;

  const trackingWindow = window as TrackingWindow;
  if (typeof trackingWindow.fbq !== "function") return false;

  const clean: FbqParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") clean[key] = value;
  });

  try {
    trackingWindow.fbq(
      "trackSingle",
      ppcMetaPixelId,
      "Contact",
      clean,
      eventId ? { eventID: eventId } : undefined,
    );
    return true;
  } catch {
    // El tracking nunca puede romper la llamada.
    return false;
  }
}
