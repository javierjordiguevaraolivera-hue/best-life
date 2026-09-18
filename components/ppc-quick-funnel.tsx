"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheckIcon,
  ChildrenIcon,
  FamilyIcon,
  HeartIcon,
  RetirementPlanIcon,
  ShieldCheckIcon,
  StatisticGrowIcon,
  UserIcon,
} from "@/components/ppc-icons";
import { buildApplicationNumber } from "@/lib/application-number";
import { createPpcEventId } from "@/lib/ppc-meta-pixel";
import { savePpcSession } from "@/lib/ppc-session";

/**
 * Funnel corto de pay-per-call: TRES preguntas de selección simple y a la
 * thank you page. Sin ZIP, sin nombre, sin teléfono, sin envío de leads.
 *
 * La ÚNICA que descalifica es la edad: de 60 en adelante no pasa. Los rangos
 * están cortados en 60 a propósito — con "55 a 65" no se podía separar a quien
 * califica de quien no.
 *
 * Vive aparte del funnel largo (components/funnel.tsx) para no arriesgar lo que
 * ya está corriendo en /, /b, /c y /verify-short.
 */

const goalOptions = [
  "Proteger a mi familia",
  "Hacer crecer mi dinero",
  "Prepararme para el retiro",
  "Los tres beneficios",
];

// Corte en 60: "60 o más" es el único descalificador de todo el funnel.
const overAgeOption = "60 o más";
const ageOptions = ["25 a 34", "35 a 44", "45 a 54", "55 a 59", overAgeOption];

const protectOptions = ["Mi pareja y mis hijos", "Mis hijos", "Mis padres", "Solo a mí por ahora"];

const ageRejectedCookieName = "bf_age_rejected";
const ageRejectedCookieDurationDays = 90;
const rejectedPath = "/ppc/rechazo";
const thankPpcPath = "/thank-ppc";

type QuickStep = "goal" | "age" | "protect";
const stepOrder: QuickStep[] = ["goal", "age", "protect"];

function hasAgeRejectedCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .includes(`${ageRejectedCookieName}=true`);
}

function setAgeRejectedCookie() {
  if (typeof document === "undefined") return;
  const maxAge = ageRejectedCookieDurationDays * 24 * 60 * 60;
  document.cookie = `${ageRejectedCookieName}=true; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function optionButtonClass(isSelected: boolean) {
  return [
    "flex min-h-[56px] w-full items-center justify-center rounded-[16px] border bg-white px-5 text-center text-[17px] tracking-[-0.03em] text-[#101820] shadow-[0_4px_10px_rgba(16,24,32,0.08)] transition md:min-h-[62px]",
    isSelected
      ? "border-[var(--brand)] bg-[#f3f8ff] shadow-[0_0_0_1px_var(--brand),0_8px_18px_rgba(26,115,232,0.12)]"
      : "border-[#9c9c9c] hover:border-[#6f6f6f]",
  ].join(" ");
}

function BackArrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15.632 22.577l-9.225-9.562a1.439 1.439 0 01-.301-.466 1.48 1.48 0 01.301-1.566l9.225-9.562c.26-.27.613-.421.98-.421.368 0 .72.151.98.42.26.27.407.636.407 1.017 0 .38-.146.746-.406 1.016L9.346 12l8.248 8.547c.26.27.406.635.406 1.016s-.146.747-.406 1.016c-.26.27-.613.421-.98.421-.368 0-.72-.151-.98-.42l-.002-.003z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function QuickFunnel() {
  const [currentStep, setCurrentStep] = useState<QuickStep>("goal");
  const [panelKey, setPanelKey] = useState(0);
  const [answers, setAnswers] = useState({ insuranceGoal: "", ageGroup: "", protectWho: "" });
  const [isRejected, setIsRejected] = useState(false);
  const navigatedRef = useRef(false);

  const currentIndex = stepOrder.indexOf(currentStep);

  // Si vuelve alguien ya descalificado, va derecho a la página de rechazo: no
  // tiene sentido volver a preguntarle la edad.
  useEffect(() => {
    if (hasAgeRejectedCookie()) window.location.replace(rejectedPath);
  }, []);

  function reject() {
    setAgeRejectedCookie();
    setIsRejected(true);
    // El PageView del pixel ya salió al cargar; acá solo se deja respirar la
    // cookie antes de navegar.
    window.setTimeout(() => window.location.replace(rejectedPath), 250);
  }

  function finish(finalAnswers: typeof answers) {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    savePpcSession({
      insuranceGoal: finalAnswers.insuranceGoal,
      ageGroup: finalAnswers.ageGroup,
      protectWho: finalAnswers.protectWho,
      applicationNumber: buildApplicationNumber(createPpcEventId("ppc")),
    });

    // Se conservan los parámetros del anuncio (sub1, fbclid…) para poder cruzar
    // la llamada con la campaña.
    const search = window.location.search;
    window.location.assign(`${thankPpcPath}${search}`);
  }

  function choose(field: keyof typeof answers, value: string) {
    if (isRejected || hasAgeRejectedCookie()) {
      setIsRejected(true);
      return;
    }

    const next = { ...answers, [field]: value };
    setAnswers(next);

    if (field === "ageGroup" && value === overAgeOption) {
      reject();
      return;
    }

    // 90ms: alcanza a verse el highlight de la selección sin frenar el paso.
    window.setTimeout(() => {
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
        setPanelKey((prev) => prev + 1);
        return;
      }
      finish(next);
    }, 90);
  }

  function goBack() {
    if (currentIndex <= 0) return;
    setCurrentStep(stepOrder[currentIndex - 1]);
    setPanelKey((prev) => prev + 1);
  }

  if (isRejected) {
    return (
      <main className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
        <section
          className="mx-auto flex min-h-screen w-full max-w-[760px] items-center justify-center px-4 py-10 text-center"
          style={{ fontFamily: '"HurmeGeo", Gilroy, Almarai, Arial, sans-serif' }}
        >
          <div className="w-full rounded-[18px] border border-[#dbe7f5] bg-white px-6 py-10 shadow-[0_18px_45px_rgba(18,31,53,0.12)] md:px-10 md:py-12">
            <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#eef6ff] text-[var(--brand)]">
              <ShieldCheckIcon className="h-[28px] w-[28px]" />
            </div>
            <h1 className="mx-auto mt-6 max-w-[560px] text-[28px] font-extrabold leading-[1.14] tracking-[-0.04em] text-[#101820] md:text-[40px]">
              Gracias por tu interés
            </h1>
            <p className="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-[#5d6674] md:text-[19px]">
              Actualmente este beneficio no está disponible según tu perfil.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const options =
    currentStep === "goal" ? goalOptions : currentStep === "age" ? ageOptions : protectOptions;
  const field =
    currentStep === "goal" ? "insuranceGoal" : currentStep === "age" ? "ageGroup" : "protectWho";

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      <header className="border-b border-transparent bg-white/96 shadow-[0_6px_18px_rgba(18,31,53,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-4 md:relative md:justify-center">
          <Image
            src="/best-money-assets/logo-best-life.png"
            alt="Best Life"
            width={190}
            height={60}
            priority
            className="h-[36px] w-[148px] object-contain md:h-[40px] md:w-[190px]"
          />
          <div className="flex items-center gap-2 md:absolute md:right-4">
            <Image
              src="/best-money-assets/secure-form-best-life2.png"
              alt="Secure Form"
              width={150}
              height={32}
              className="h-auto w-[128px] md:w-[136px]"
            />
          </div>
        </div>
      </header>

      <div
        className="mx-auto flex w-full max-w-[760px] flex-col items-center px-3 pt-4 md:px-4"
        style={{ fontFamily: '"HurmeGeo", Gilroy, Almarai, Arial, sans-serif' }}
      >
        <div className="flex w-full items-center justify-between gap-3 md:gap-4">
          {currentIndex === 0 ? (
            <div aria-hidden="true" className="h-9 w-9" />
          ) : (
            <button
              type="button"
              onClick={goBack}
              aria-label="Atrás"
              className="inline-flex h-9 w-9 items-center justify-center text-[#6b7280] [font-size:0] transition hover:text-[#101820]"
            >
              <BackArrowIcon className="h-[18px] w-[18px]" />
            </button>
          )}

          <div className="relative w-full max-w-[300px] overflow-hidden rounded-full bg-[#d9d9d9]">
            <div
              className="h-[8px] rounded-full bg-[var(--brand)] transition-[width] duration-300"
              style={{ width: `${((currentIndex + 1) / stepOrder.length) * 100}%` }}
            />
          </div>

          <div className="flex w-[58px] shrink-0 justify-end md:w-[70px]">
            <span className="whitespace-nowrap text-[12px] font-black tracking-[-0.02em] text-[var(--brand-dark)] md:text-[13px]">
              {currentIndex + 1} de {stepOrder.length}
            </span>
          </div>
        </div>

        <div key={`panel-${panelKey}`} className="w-full animate-[fade-up_0.28s_ease-out]">
          <div className="mt-4 text-center md:mt-6">
            <p className="mx-auto mb-1 max-w-[520px] text-[14px] font-extrabold uppercase tracking-[0.04em] text-[var(--brand)] md:mb-1.5 md:text-[16px]">
              Aplica para los beneficios IUL
            </p>
            <h2 className="mx-auto max-w-[720px] text-[26px] leading-[1.14] font-bold tracking-[-0.04em] text-[#101820] md:text-[44px]">
              {currentStep === "goal" && "¿Qué beneficio del seguro IUL te interesa más?"}
              {currentStep === "age" && "¿En qué grupo de edad estás?"}
              {currentStep === "protect" && "¿A quién quieres proteger?"}
            </h2>
          </div>

          <div className="mx-auto mt-5 grid w-full max-w-[460px] gap-2.5 md:mt-10 md:gap-4">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => choose(field, option)}
                className={optionButtonClass(answers[field] === option)}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {currentStep === "goal" ? (
                    option === "Proteger a mi familia" ? (
                      <ShieldCheckIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    ) : option === "Hacer crecer mi dinero" ? (
                      <StatisticGrowIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    ) : option === "Prepararme para el retiro" ? (
                      <RetirementPlanIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    ) : (
                      <BadgeCheckIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    )
                  ) : null}
                  {currentStep === "protect" ? (
                    option === "Mi pareja y mis hijos" ? (
                      <FamilyIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    ) : option === "Mis hijos" ? (
                      <ChildrenIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    ) : option === "Mis padres" ? (
                      <HeartIcon className="h-[21px] w-[21px] text-[#5d6674]" />
                    ) : (
                      <UserIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    )
                  ) : null}
                  <span className="font-black tracking-[-0.02em]">{option}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-9 px-4 pb-3 pt-3 text-center text-[9px] leading-[1.35] text-[#b8bec8] md:text-[10px]">
        <p>© 2025 Best Life. All Rights Reserved.</p>
        <p className="mx-auto mt-2 max-w-[920px]">
          This site is not part of Facebook or Meta Platforms, Inc. Additionally, this site is not
          endorsed by Facebook in any way. “Facebook” is a registered trademark of Meta Platforms,
          Inc.
        </p>
      </footer>
    </main>
  );
}
