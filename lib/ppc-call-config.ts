// === Número de la landing pay-per-call /ppc → /thank-ppc ===
// Va fijo acá, NO en variables de entorno: es parte del contenido de la
// página, no de la configuración del despliegue. Tampoco rota: esta landing no
// pasa por ningún pool de números.
//
// Este archivo es exclusivo de /ppc. Ninguna otra página de Best Life lo usa.
const ppcPhoneDigits = "8884619420";

/** Formato "de anuncio": (888) 461-9420. El tel: siempre va en E.164. */
export function formatPpcPhone(digits: string) {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function ppcPhone() {
  return {
    digits: ppcPhoneDigits,
    href: `tel:+1${ppcPhoneDigits}`,
    label: formatPpcPhone(ppcPhoneDigits),
  };
}
