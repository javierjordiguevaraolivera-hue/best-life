// Puente entre el funnel corto de 3 preguntas (/ppc) y su thank you page
// (/thank-ppc). Igual que el funnel largo: sessionStorage, no la URL.
//
// Aparte del storage, /thank-ppc también acepta age_group e insurance_goal por
// query param — así es como los pasaba la página original de Best Life y sirve
// para abrirla directo y probarla.

export type PpcSession = {
  insuranceGoal: string;
  ageGroup: string;
  protectWho: string;
  applicationNumber: string;
};

const storageKey = "cni-ppc-session";

export function savePpcSession(session: PpcSession) {
  if (typeof window === "undefined") return false;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function readPpcSession(): PpcSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PpcSession> | null;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      insuranceGoal: String(parsed.insuranceGoal || ""),
      ageGroup: String(parsed.ageGroup || ""),
      protectWho: String(parsed.protectWho || ""),
      applicationNumber: String(parsed.applicationNumber || ""),
    };
  } catch {
    return null;
  }
}
