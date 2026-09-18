"use client";

import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import ThankPpcPanel from "@/components/ppc-thank-panel";
import { readPpcSession, type PpcSession } from "@/lib/ppc-session";

/**
 * Toma las respuestas del funnel corto. Primero de sessionStorage (así las deja
 * /ppc y así no viajan en la URL); si no hay, de los query params, que es como
 * los pasaba la página original de Best Life y sirve para abrirla y probarla.
 *
 * sessionStorage se lee con useSyncExternalStore y no con un efecto: en el
 * servidor devuelve null, en el navegador el valor real, y React resuelve el
 * salto sin desajustar la hidratación ni encadenar renders.
 */

// La sesión no cambia mientras la página vive, pero getSnapshot tiene que
// devolver SIEMPRE la misma referencia o React vuelve a renderizar sin fin.
let cachedSession: PpcSession | null | undefined;

function getSessionSnapshot() {
  if (cachedSession === undefined) cachedSession = readPpcSession();
  return cachedSession;
}

function getServerSessionSnapshot(): PpcSession | null {
  return null;
}

/** No hay a qué suscribirse: sessionStorage no avisa cuando cambia. */
function subscribe() {
  return () => {};
}

export default function ThankPpcClient() {
  const searchParams = useSearchParams();
  const session = useSyncExternalStore(subscribe, getSessionSnapshot, getServerSessionSnapshot);

  const ageGroup = session?.ageGroup || searchParams.get("age_group") || "";
  const insuranceGoal = session?.insuranceGoal || searchParams.get("insurance_goal") || "";
  const applicationNumber =
    session?.applicationNumber || searchParams.get("application_number") || "";

  return (
    <ThankPpcPanel
      ageGroup={ageGroup}
      insuranceGoal={insuranceGoal}
      applicationNumber={applicationNumber}
    />
  );
}
