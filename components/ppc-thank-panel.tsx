"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { buildApplicationNumber } from "@/lib/application-number";
import { createPpcEventId, trackPpcContact } from "@/lib/ppc-meta-pixel";
import { ppcPhone } from "@/lib/ppc-call-config";

/**
 * Thank you page de pay-per-call. Copia física de /thanks/call2 de Best Life,
 * con una diferencia de fondo: acá el NÚMERO ES FIJO.
 *
 * Lo que se quedó fuera del original a propósito:
 *   · el script de Ringba y su pool de números
 *   · el MutationObserver + el sondeo cada 250ms que perseguía el número impreso
 *   · el POST a /api/call-attribution y el sessionStorage del número impreso
 *   · la ventana horaria del runtime config (acá se atiende siempre)
 *
 * Sin rotación no hay nada que observar: el número se pinta una vez y listo.
 */

const calculatedBenefits = [
  { label: "Protección de hipoteca", icon: "home" },
  { label: "Beneficio por fallecimiento", icon: "ribbon" },
  { label: "Gastos finales", icon: "flowers" },
  { label: "Valor en efectivo para el retiro", icon: "coins" },
];

const benefits = [
  "Protección para tu familia",
  "Pago de hipoteca",
  "Mensualidades para tus seres queridos",
  "Beneficios para jubilación",
  "Acumulación de cash value",
  "Apoyo económico en vida",
  "Gastos finales y protección familiar",
];

function BenefitIcon({ icon }: { icon: string }) {
  if (icon === "home") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
        <path d="M12 2.2 1.4 11a1.3 1.3 0 0 0 1.7 2l1.4-1.2v8.5c0 .8.7 1.5 1.5 1.5h4.2v-6h3.6v6H18c.8 0 1.5-.7 1.5-1.5v-8.5l1.4 1.2a1.3 1.3 0 0 0 1.7-2l-3.1-2.6V4.1c0-.6-.5-1.1-1.1-1.1h-1.7c-.6 0-1.1.5-1.1 1.1v1.1L12 2.2Z" />
      </svg>
    );
  }

  if (icon === "ribbon") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
        <path d="M11.9 2C9.5 2 7.7 3.8 7.7 6.2c0 2.1 1.2 4.2 2.5 6.3L5.8 21h4.1l2.1-4.5 2.2 4.5h4l-4.5-8.5c1.4-2.2 2.6-4.3 2.6-6.3C16.3 3.8 14.4 2 11.9 2Zm0 3.1c.8 0 1.4.5 1.4 1.3 0 .9-.5 2-1.4 3.5-.8-1.5-1.3-2.6-1.3-3.5 0-.8.5-1.3 1.3-1.3Z" />
      </svg>
    );
  }

  if (icon === "flowers") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
        <path d="m8.2 2.3-3.4 4 2.5 15.4h9.4l2.5-15.4-3.4-4H8.2Z" />
        <path fill="#eaf2ff" d="M10.8 6h2.4v3.2h2.7v2.3h-2.7v5h-2.4v-5H8.1V9.2h2.7V6Z" />
      </svg>
    );
  }

  if (icon === "coins") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 28 24"
        className="h-6 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="5" cy="17" rx="4" ry="2" />
        <path d="M1 17v4c0 1.1 1.8 2 4 2s4-.9 4-2v-4M1 19c0 1.1 1.8 2 4 2s4-.9 4-2" />
        <ellipse cx="14" cy="11" rx="4" ry="2" />
        <path d="M10 11v10c0 1.1 1.8 2 4 2s4-.9 4-2V11M10 14c0 1.1 1.8 2 4 2s4-.9 4-2M10 17c0 1.1 1.8 2 4 2s4-.9 4-2M10 20c0 1.1 1.8 2 4 2s4-.9 4-2" />
        <ellipse cx="23" cy="5" rx="4" ry="2" />
        <path d="M19 5v16c0 1.1 1.8 2 4 2s4-.9 4-2V5M19 8c0 1.1 1.8 2 4 2s4-.9 4-2M19 11c0 1.1 1.8 2 4 2s4-.9 4-2M19 14c0 1.1 1.8 2 4 2s4-.9 4-2M19 17c0 1.1 1.8 2 4 2s4-.9 4-2M19 20c0 1.1 1.8 2 4 2s4-.9 4-2" />
      </svg>
    );
  }

  return null;
}

function getGoalLabel(goal: string) {
  const normalized = goal.trim().toLowerCase();
  if (normalized === "hacer crecer mi dinero") return "el crecimiento de tu dinero";
  if (normalized === "prepararme para el retiro") return "tu plan de retiro";
  if (normalized === "proteger a mi familia") return "la protección de tu familia";
  if (normalized === "los tres beneficios") return "tu plan IUL completo";
  return normalized || "tu seguro de vida IUL";
}

export default function ThankPpcPanel({
  ageGroup = "",
  insuranceGoal = "",
  applicationNumber = "",
}: {
  ageGroup?: string;
  insuranceGoal?: string;
  applicationNumber?: string;
}) {
  const phone = ppcPhone();
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [resolvedBenefitCount, setResolvedBenefitCount] = useState(0);
  const trackedClickRef = useRef(false);

  // Quien entra directo a /thank-ppc, sin pasar por /ppc, no trae número de
  // aplicación. Ahí se usa el de por defecto, que es determinista: si fuera
  // aleatorio, servidor y navegador pintarían distinto y rompería la hidratación.
  const resolvedApplicationNumber = applicationNumber || buildApplicationNumber(null);
  const goalLabel = getGoalLabel(insuranceGoal);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Los beneficios se van "calculando" uno por uno: es el open loop que
  // sostiene la atención mientras el usuario decide marcar.
  useEffect(() => {
    const timeoutIds = calculatedBenefits.map((_, index) =>
      window.setTimeout(() => setResolvedBenefitCount(index + 1), 1200 + index * 1050),
    );

    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, []);

  // Una sola vez por sesión: si marca dos veces sigue siendo la misma llamada.
  function handleCall() {
    if (trackedClickRef.current) return;
    trackedClickRef.current = true;

    // Directo al pixel de Meta, sin Tag Manager de por medio.
    trackPpcContact(
      {
        content_name: "click_to_call",
        call_variant: "ppc",
        call_number: phone.digits,
        age_group: ageGroup || undefined,
        insurance_goal: insuranceGoal || undefined,
      },
      createPpcEventId("contact"),
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#101820]">
      <style>{`
        @keyframes ppc-soft-pulse {
          0% { opacity: 0.52; transform: scale(1); }
          70%, 100% { opacity: 0; transform: scale(1.09, 1.34); }
        }
        .ppc-soft-pulse::before { animation: ppc-soft-pulse 2.4s ease-out infinite; }

        @keyframes ppc-phone-ring {
          0%, 72%, 100% { transform: rotate(0deg) scale(1); }
          76% { transform: rotate(-13deg) scale(1.08); }
          80% { transform: rotate(12deg) scale(1.08); }
          84% { transform: rotate(-9deg) scale(1.06); }
          88% { transform: rotate(7deg) scale(1.04); }
          92% { transform: rotate(0deg) scale(1); }
        }
        .ppc-phone-ring { animation: ppc-phone-ring 2.4s ease-in-out infinite; transform-origin: center; }

        @keyframes ppc-call-wave {
          0%, 18% { opacity: 0; }
          28%, 70% { opacity: 1; }
          82%, 100% { opacity: 0; }
        }
        .ppc-call-wave { animation: ppc-call-wave 3.2s ease-in-out infinite; stroke-width: 3; }
        .ppc-call-wave-2 { animation-delay: 0.4s; }
        .ppc-call-wave-3 { animation-delay: 0.8s; }

        @media (prefers-reduced-motion: reduce) {
          .ppc-soft-pulse::before, .ppc-phone-ring, .ppc-call-wave { animation: none; }
          .ppc-call-wave { opacity: 1; }
        }
      `}</style>

      <header className="border-b border-[#eef2f7] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[980px] items-center justify-between gap-3 px-4">
          <Image
            src="/best-money-assets/logo-best-life.png"
            alt="Best Life"
            width={180}
            height={48}
            priority
            className="h-auto w-[132px] sm:w-[150px]"
          />
          <a
            href={phone.href}
            onClick={handleCall}
            data-call-cta="header"
            style={{ color: "#ffffff" }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#16a34a] px-3 text-white shadow-[0_3px_8px_rgba(22,163,74,0.28)] transition hover:bg-[#12813c] active:scale-[0.98]"
            aria-label={"Llamar al " + phone.label}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 36 32"
              className="h-5 w-5 shrink-0"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.2 5.5 11 4.3l3.1 6.1-2.4 1.8a18.6 18.6 0 0 0 7.8 7.8l1.8-2.4 6.1 3.1-1.2 3.8c-.5 1.5-2 2.4-3.5 2.1C12.9 24.9 5.3 17.3 3.6 7.5c-.3-1.5.6-3 2.1-3.5l1.5-.5" />
              <path className="ppc-call-wave" d="M20.5 12c1.8.5 3.2 1.9 3.7 3.7" />
              <path className="ppc-call-wave ppc-call-wave-2" d="M22 7.2c3.4.9 6.1 3.6 7 7" />
              <path className="ppc-call-wave ppc-call-wave-3" d="M23.5 2.7c5.2 1.1 9.3 5.2 10.4 10.4" />
            </svg>
            <span className="text-[12px] font-black leading-none text-white sm:text-[13px]">
              Llamar ahora
            </span>
          </a>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[560px] flex-col px-5 py-7 text-center">
        <Image
          src="/best-money-assets/vT8DJ.gif"
          alt="Procesando solicitud"
          width={300}
          height={300}
          unoptimized
          priority
          className="mx-auto h-16 w-16"
        />

        <p className="mt-5 text-[14px] font-black uppercase tracking-[0.08em] text-[var(--brand)]">
          Beneficios preaprobados
        </p>
        <h1 className="mt-2 text-[26px] font-black leading-[1.12] md:text-[34px]">
          Tu aplicación está lista
        </h1>

        <div className="mx-auto mt-4 w-full max-w-[440px]">
          <p className="text-[16px] leading-[1.5] text-[#5d6674]">
            Al llamar puedes solicitar beneficios adicionales como:
          </p>
          <div className="mt-4 grid gap-2.5 text-left" aria-live="polite">
            {calculatedBenefits
              .slice(0, Math.min(resolvedBenefitCount + 1, calculatedBenefits.length))
              .map((benefit, index) => {
                const applies = index < resolvedBenefitCount;

                return (
                  <div
                    key={benefit.label}
                    className="flex min-h-11 animate-[fade-up_.35s_ease-out] items-center justify-between gap-3 rounded-xl border border-[#e1e8f0] bg-[#f8fafc] px-3.5 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#2d6cdf]">
                        <BenefitIcon icon={benefit.icon} />
                      </span>
                      <span className="text-[14px] font-bold text-[#273449]">{benefit.label}</span>
                    </span>
                    <span
                      className={
                        "flex shrink-0 items-center gap-1.5 text-[12px] font-black " +
                        (applies ? "text-[#16a34a]" : "text-[#7b8494]")
                      }
                    >
                      {applies ? (
                        <>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16a34a] text-white">
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </span>
                          Aplica
                        </>
                      ) : (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#2d6cdf]" />
                          Calculando
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="mt-6 rounded-[18px] bg-[#10203a] px-4 py-5 text-white shadow-[0_16px_36px_rgba(16,32,58,0.18)]">
          <p className="text-[13px] font-black uppercase tracking-[0.08em] text-white/65">
            Agente esperando en la línea
          </p>
          <a
            href={phone.href}
            onClick={handleCall}
            data-call-cta="numero"
            style={{ color: "#ffffff" }}
            className="mt-2 block text-[clamp(2rem,8vw,2.7rem)] font-black text-white"
          >
            {phone.label}
          </a>
          <a
            href={phone.href}
            onClick={handleCall}
            data-call-cta="principal"
            style={{ color: "#ffffff" }}
            className="ppc-soft-pulse relative isolate mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] px-6 text-[18px] font-black text-white shadow-[0_12px_26px_rgba(22,163,74,0.25)] transition before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-[#16a34a] hover:bg-[#12813c]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="ppc-phone-ring h-6 w-6 shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeMiterlimit="10"
              />
            </svg>
            Llamar ahora
          </a>
        </div>

        <p
          className={
            "mt-5 text-[15px] font-black " +
            (secondsLeft === 0 ? "text-[#e05b24]" : "text-[#273449]")
          }
        >
          {secondsLeft === 0
            ? "Tu aplicación está por expirar."
            : "Tu aplicación finaliza en " + secondsLeft + " segundos."}
        </p>

        <div className="mt-5 border-y border-[#dde7f4] py-5">
          <p className="text-[13px] font-black uppercase tracking-[0.08em] text-[#6b7280]">
            ID de aplicación
          </p>
          <p className="mt-1 min-h-[30px] text-[24px] font-black text-[#f2382e]">
            {resolvedApplicationNumber}
          </p>
          <p className="mt-2 text-[13px] font-semibold text-[#e05b24]">
            Usa este identificador para reclamar tus beneficios
          </p>
        </div>

        <div className="mt-5 rounded-[16px] border border-[#d9e6fb] bg-[#f7fbff] px-4 py-4 text-left">
          <p className="text-[15px] font-black text-[#101820]">
            También podrías calificar para beneficios como:
          </p>
          <div className="mt-3 grid gap-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-2 text-[14px] font-semibold leading-[1.35] text-[#273449]"
              >
                <span className="text-[#18bf79]">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-[420px] text-[12px] leading-[1.45] text-[#7b8494]">
          Un agente licenciado revisará contigo los detalles de {goalLabel}. La llamada es gratuita y
          sin compromiso.
        </p>
      </section>
    </main>
  );
}
