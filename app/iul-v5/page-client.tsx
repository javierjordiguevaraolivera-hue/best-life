"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createEventId, getUtmParams, pushGtmEvent } from "@/lib/gtm-events";
import { formatUsPhone, normalizeUsPhone } from "@/lib/phone";

// Número fijo del PPC landing (Vercel JS / best-life.pro). Cambiar aquí cuando Antony confirme el definitivo.
const ppcPhoneNumber = "+12819906221";
const ppcPhoneDisplay = "(281) 990-6221";

const questionnaireSecuritySeals = [
  {
    src: "/best-money-assets/busines-acredited-bbb.avif",
    alt: "BBB Accredited Business",
    width: 112,
    height: 38,
  },
  {
    src: "/best-money-assets/secure-form-best-life2.png",
    alt: "Secure Form",
    width: 136,
    height: 32,
  },
  {
    src: "/best-money-assets/ssl-encription.avif",
    alt: "SSL Encryption",
    width: 112,
    height: 38,
  },
];

const ageOptions = ["25 a 34", "35 a 44", "45 a 54", "55 a 65", "65+"];
const goalOptions = [
  "Seguro de vida",
  "Ahorrar e invertir",
  "Planificación de retiro",
  "No estoy seguro aún",
];
const retirementOptions = [
  "Antes de los 60",
  "Entre los 60 y 65",
  "Después de los 65",
];
const usaStatusOptions = ["Ciudadano Americano", "Residente Permanente", "Otro estatus"];
const financialOptions = [
  "401(k) o 403(b)",
  "IRA Tradicional",
  "Roth IRA",
  "Acciones o Fondos Mutuos",
  "Bienes Raíces",
  "CDs o Bonos",
  "Otras inversiones",
  "Aún no tengo ninguna",
];
const financialNoneOption = "Aún no tengo ninguna";

const stateOptions = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
];
const stateAbbreviations: Record<string, string> = {
  Alabama: "al",
  Alaska: "ak",
  Arizona: "az",
  Arkansas: "ar",
  California: "ca",
  Colorado: "co",
  Connecticut: "ct",
  Delaware: "de",
  Florida: "fl",
  Georgia: "ga",
  Hawaii: "hi",
  Idaho: "id",
  Illinois: "il",
  Indiana: "in",
  Iowa: "ia",
  Kansas: "ks",
  Kentucky: "ky",
  Louisiana: "la",
  Maine: "me",
  Maryland: "md",
  Massachusetts: "ma",
  Michigan: "mi",
  Minnesota: "mn",
  Mississippi: "ms",
  Missouri: "mo",
  Montana: "mt",
  Nebraska: "ne",
  Nevada: "nv",
  "New Hampshire": "nh",
  "New Jersey": "nj",
  "New Mexico": "nm",
  "New York": "ny",
  "North Carolina": "nc",
  "North Dakota": "nd",
  Ohio: "oh",
  Oklahoma: "ok",
  Oregon: "or",
  Pennsylvania: "pa",
  "Rhode Island": "ri",
  "South Carolina": "sc",
  "South Dakota": "sd",
  Tennessee: "tn",
  Texas: "tx",
  Utah: "ut",
  Vermont: "vt",
  Virginia: "va",
  Washington: "wa",
  "West Virginia": "wv",
  Wisconsin: "wi",
  Wyoming: "wy",
  "District of Columbia": "dc",
};

type FunnelStep =
  | "age"
  | "goal"
  | "retirement"
  | "status"
  | "zip"
  | "name"
  | "contact"
  | "financial"
  | "loading"
  | "call"
  | "rejected";

type FunnelAnswers = {
  zipCode: string;
  locationText: string;
  ageGroup: string;
  insuranceGoal: string;
  retirementAge: string;
  usaStatus: string;
  financialAccounts: string[];
  state: string;
  firstName: string;
  lastName: string;
  phoneCountry: string;
  phoneNumber: string;
  email: string;
  detectedState: string;
};

type PhoneValidationStatus = "idle" | "validating" | "valid" | "invalid";

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

type PhoneVerifyResponse = {
  ok?: boolean;
  normalized?: string;
  reason?: string | null;
  flags?: string[];
  veriphone?: PhoneVerificationEvidence | null;
  verificationToken?: string | null;
};

type ZipLookupResponse = {
  location?: string | null;
  state?: string | null;
  zipCode?: string | null;
  source?: "zippopotam" | "vercel-ip" | "fallback";
  fallback?: boolean;
};

const leadQuestionSteps: FunnelStep[] = [
  "age",
  "goal",
  "retirement",
  "status",
  "zip",
  "name",
  "contact",
];
const callQuestionSteps: FunnelStep[] = [
  "age",
  "goal",
  "retirement",
  "status",
  "financial",
];

const emptyAnswers: FunnelAnswers = {
  zipCode: "",
  locationText: "",
  ageGroup: "",
  insuranceGoal: "",
  retirementAge: "",
  usaStatus: "",
  financialAccounts: [],
  state: "",
  firstName: "",
  lastName: "",
  phoneCountry: "US",
  phoneNumber: "",
  email: "",
  detectedState: "",
};

const deviceStorageKey = "best-life-iul-v5-device-id";
const deviceCookieName = "bf_iul_device_id";
const trustedFormScriptId = "trustedform-certify-sdk";
const trustedFormFieldName = process.env.NEXT_PUBLIC_TRUSTEDFORM_FIELD || "xxTrustedFormCertUrl";
const deviceCookieDurationDays = 15;
const ageRejectedCookieName = "bf_age_rejected";
const ageRejectedCookieDurationDays = 90;
const ageRejectedHash = "#no-califica";
const blockedStateName = "New York";
const loadingDurationMs = 3600;

const loadingChecklist = [
  "Verificando tus respuestas...",
  "Confirmando disponibilidad en tu estado...",
  "Buscando un asesor certificado...",
];

const callBenefits = [
  {
    title: "Llamada 100% gratuita",
    description: "Sin costo y sin compromiso de compra.",
  },
  {
    title: "Asesor certificado en español",
    description: "Resuelve tus dudas en 10 a 15 minutos.",
  },
  {
    title: "Cupos limitados hoy",
    description: "Llama ahora para asegurar tu evaluación.",
  },
];

function formatPhoneDigits(value: string) {
  return formatUsPhone(value);
}

function normalizeUsPhoneInput(value: string) {
  return normalizeUsPhone(value);
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) {
    setDeviceCookie(existing);
    return existing;
  }

  const newId = `bm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(deviceStorageKey, newId);
  setDeviceCookie(newId);
  return newId;
}

function getTrustedFormCertUrl() {
  if (typeof document === "undefined") return "";

  const field = document.getElementsByName(trustedFormFieldName)[0] as HTMLInputElement | undefined;
  return field?.value?.trim() || "";
}

function setDeviceCookie(deviceId: string) {
  if (typeof document === "undefined" || !deviceId) return;

  const maxAge = deviceCookieDurationDays * 24 * 60 * 60;
  document.cookie = `${deviceCookieName}=${encodeURIComponent(deviceId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function getZipValidationMessage(value: string) {
  const zipCode = normalizeZipCode(value);

  if (zipCode.length !== 5) {
    return "Ingresa un ZIP code valido de EE.UU. con 5 digitos.";
  }

  return "";
}

function isResolvedUsZip(
  data: ZipLookupResponse | null,
  requestedZipCode: string
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

function isBlockedState(state?: string | null) {
  return state === blockedStateName;
}

function isCallPathStatus(status: string) {
  return status === "Ciudadano Americano" || status === "Residente Permanente";
}

function optionButtonClass(isSelected: boolean, isRecommended = false) {
  return [
    "flex min-h-[62px] w-full items-center rounded-[16px] border bg-white px-5 text-left text-[17px] tracking-[-0.03em] text-[#101820] shadow-[0_4px_10px_rgba(16,24,32,0.08)] transition",
    isSelected
      ? "border-[var(--brand)] bg-[#f3f8ff] shadow-[0_0_0_1px_var(--brand),0_8px_18px_rgba(26,115,232,0.12)]"
      : isRecommended
        ? "border-[#9ec5ff] bg-[#f7fbff] shadow-[0_0_0_1px_rgba(26,115,232,0.18),0_4px_10px_rgba(16,24,32,0.08)] hover:border-[#78adff]"
        : "border-[#9c9c9c] hover:border-[#6f6f6f]",
  ].join(" ");
}

function NextArrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      className={className}
    >
      <line
        x1="40"
        y1="128"
        x2="216"
        y2="128"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="24"
      />
      <polyline
        points="144 56 216 128 144 200"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="24"
      />
    </svg>
  );
}

function BackArrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15.632 22.577l-9.225-9.562a1.439 1.439 0 01-.301-.466 1.48 1.48 0 01.301-1.566l9.225-9.562c.26-.27.613-.421.98-.421.368 0 .72.151.98.42.26.27.407.636.407 1.017 0 .38-.146.746-.406 1.016L9.346 12l8.248 8.547c.26.27.406.635.406 1.016s-.146.747-.406 1.016c-.26.27-.613.421-.98.421-.368 0-.72-.151-.98-.42l-.002-.003z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilledCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m8 12.4 2.4 2.4L16.4 9"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="currentColor" />
      <path
        d="m7.4 12.3 2.7 2.8 6.4-6.5"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M7.2 4.8c.5-.5 1.3-.6 1.9-.2l2.1 1.4c.7.4.9 1.3.5 2L10.7 10c-.2.4-.1.8.1 1.1.7 1.2 1.7 2.2 2.9 2.9.3.2.8.2 1.1.1l2.1-1.1c.7-.4 1.6-.2 2 .5l1.4 2.1c.4.6.3 1.4-.2 1.9l-1 1c-.9.9-2.2 1.3-3.4 1-2.6-.7-5.1-2.2-7.2-4.3-2.1-2.1-3.6-4.6-4.3-7.2-.3-1.2.1-2.5 1-3.4l1-1Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DialFingerIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path d="M1.875 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375h0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="1.5" x2="7.125" y2="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="12.375" y1="1.5" x2="12.375" y2="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12.375 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="1.875" y1="6.75" x2="1.875" y2="6.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M1.875 6.75a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="6.75" x2="7.125" y2="6.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125 6.75a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="1.875" y1="12" x2="1.875" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M1.875 12a.375.375 0 1 0 .375.375A.375.375 0 0 0 1.875 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="12" x2="7.125" y2="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125 12a.375.375 0 1 0 .375.375A.375.375 0 0 0 7.125 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6.75 22.5l-1.9-3.327A2.263 2.263 0 0 1 8.7 16.8l1.8 2.7V8.25a2.25 2.25 0 0 1 4.5 0V16.5h3.379A4.332 4.332 0 0 1 22.5 20.847V22.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 317.855 317.855" className={className} fill="currentColor">
      <path d="M158.929 317.855c-1.029 0-2.059-.159-3.051-.477-33.344-10.681-61.732-31.168-84.377-60.891-17.828-23.401-32.103-52.526-42.426-86.566C11.661 112.506 11.461 61.358 11.461 59.209c0-5.15 3.912-9.459 9.039-9.954.772-.075 78.438-8.048 132.553-47.347 3.504-2.546 8.249-2.543 11.753.001C218.906 41.207 296.582 49.18 297.36 49.256c5.123.5 9.034 4.807 9.034 9.953 0 2.149-.2 53.297-17.613 110.713-10.324 34.04-24.598 63.165-42.426 86.566-22.644 29.723-51.032 50.21-84.376 60.891-.992.317-2.021.476-3.05.476zM31.748 67.982c.831 16.784 4.062 55.438 16.604 96.591 21.405 70.227 58.601 114.87 110.576 132.746 52.096-17.916 89.335-62.711 110.713-133.202 12.457-41.074 15.653-79.434 16.472-96.134-22.404-3.269-80.438-14.332-127.186-45.785C112.175 53.648 54.153 64.713 31.748 67.982z" />
      <path d="M153.582 207.625c-2.372 0-4.68-.844-6.499-2.4l-36.163-30.926c-4.197-3.589-4.69-9.901-1.101-14.099 3.588-4.198 9.901-4.692 14.099-1.101l28.124 24.051 55.743-73.118c3.348-4.392 9.622-5.24 14.015-1.89 4.393 3.348 5.238 9.623 1.89 14.015l-62.155 81.53c-1.667 2.187-4.16 3.591-6.895 3.882-.353.037-.706.056-1.058.056z" />
    </svg>
  );
}

function StatisticGrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 5v5a1 1 0 0 1-2 0V7.41l-5.29 5.3a1 1 0 0 1-1.16.18l-5.29-2.64-4.49 5.39A1 1 0 0 1 3 16a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41l5-6a1 1 0 0 1 1.22-.25l5.35 2.67L18.59 6H16a1 1 0 0 1 0-2h5a1 1 0 0 1 .38.08 1 1 0 0 1 .54.54A1 1 0 0 1 22 5ZM21 18H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2Z" />
    </svg>
  );
}

function RetirementPlanIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21 6.25C21 4.455 19.545 3 17.75 3H6.25C4.455 3 3 4.455 3 6.25v11.5C3 19.545 4.455 21 6.25 21h5.772a6.45 6.45 0 0 1-.709-1.5H6.25A1.75 1.75 0 0 1 4.5 17.75V8.5h15v2.814c.534.172 1.037.411 1.5.708V6.25ZM6.25 4.5h11.5a1.75 1.75 0 0 1 1.75 1.75V7h-15v-.75A1.75 1.75 0 0 1 6.25 4.5Z" />
      <path d="M23 17.5a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0Zm-5.5 0h2a.5.5 0 0 1 0 1H17a.5.5 0 0 1-.5-.491V15a.5.5 0 0 1 1 0v2.5Z" />
    </svg>
  );
}

function UnsureIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="12" y1="13" x2="12" y2="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 17v.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function FlagIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <line
        x1="5"
        y1="3"
        x2="5"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 4.5c2.2-1.1 4.3-1.1 6.5 0s4.3 1.1 6.5 0v8.5c-2.2 1.1-4.3 1.1-6.5 0s-4.3-1.1-6.5 0V4.5Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function DoubleCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="m2.5 12.5 4 4L14 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m11.5 15.5 1 1L21 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuestionMarkIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M8.6 8.6a3.4 3.4 0 1 1 5.6 2.6c-1.2 1-2.2 1.7-2.2 3.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="18.6" r="1.4" fill="currentColor" />
    </svg>
  );
}

function BoltIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13.4 2 6.8 12h4l-1.2 10L16.2 12h-4.1L13.4 2Z" />
    </svg>
  );
}

function PhoneStatusIcon({ status }: { status: PhoneValidationStatus }) {
  if (status === "validating") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] animate-spin text-[#94a3b8]"
        fill="none"
      >
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" opacity="0.24" />
        <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (status === "valid") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[20px] w-[20px] text-[#16a34a]"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="m7.8 12.2 2.6 2.6 5.8-6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === "invalid") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[20px] w-[20px] text-[#dc2626]"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

function lowerGtmValue(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || undefined;
}

function getGtmState(value?: string | null) {
  const state = String(value || "").trim();
  if (/^[A-Za-z]{2}$/.test(state)) return state.toLowerCase();
  return stateAbbreviations[state] || lowerGtmValue(state);
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<FunnelStep>(() =>
    hasAgeRejectedCookie() ? "rejected" : "age",
  );
  const [panelKey, setPanelKey] = useState(0);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);
  const [answers, setAnswers] = useState<FunnelAnswers>(emptyAnswers);
  const defaultLocationText = emptyAnswers.locationText;
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [zipError, setZipError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [phoneValidationStatus, setPhoneValidationStatus] = useState<PhoneValidationStatus>("idle");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [phoneVerification, setPhoneVerification] = useState<PhoneVerificationEvidence | null>(null);
  const [hasBlurredPhone, setHasBlurredPhone] = useState(false);
  const [leadToken, setLeadToken] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [evaluationCode, setEvaluationCode] = useState("");
  const transitionTimeoutRef = useRef<number | null>(null);
  const phoneValidationTimeoutRef = useRef<number | null>(null);
  const phoneValidationRequestRef = useRef(0);
  const phoneValidationAbortRef = useRef<AbortController | null>(null);
  const trackedStepsRef = useRef<Set<string>>(new Set());
  const submittedLeadRef = useRef(false);
  const submittedLeadIdRef = useRef("");
  const leadUrlRef = useRef("");
  const loadingIntervalRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  const isRejectedPage = currentStep === "rejected";
  const isLoadingStep = currentStep === "loading";
  const isCallStep = currentStep === "call";
  const isCallPath = isCallPathStatus(answers.usaStatus);
  const visibleQuestionSteps = isCallPath ? callQuestionSteps : leadQuestionSteps;
  const currentQuestionIndex = visibleQuestionSteps.indexOf(currentStep);
  const progressLabel =
    currentQuestionIndex >= 0
      ? `${currentQuestionIndex + 1} de ${visibleQuestionSteps.length}`
      : "";
  const progress =
    currentQuestionIndex >= 0
      ? ((currentQuestionIndex + 1) / visibleQuestionSteps.length) * 100
      : null;
  const animationClass = isTransitioningOut
    ? "animate-[survey-question-out_0.18s_cubic-bezier(0.4,0,1,1)_forwards]"
    : "animate-[survey-question-in_0.42s_cubic-bezier(0.22,0.61,0.36,1)]";
  const recommendedAgeOption = answers.ageGroup ? "" : "35 a 44";
  const recommendedGoalOption = answers.insuranceGoal ? "" : "Ahorrar e invertir";
  const resolvedUsState = stateOptions.includes(answers.state) ? answers.state : "";

  const normalizedPhone = normalizeUsPhoneInput(answers.phoneNumber);
  const phoneBorderClass =
    phoneValidationStatus === "invalid" || phoneError
      ? "border-[#e11d48] focus:border-[#e11d48]"
      : phoneValidationStatus === "valid"
        ? "border-[#16a34a] focus:border-[#16a34a]"
        : "border-[#9c9c9c] focus:border-[var(--brand)]";
  const visiblePhoneError =
    phoneValidationStatus === "validating"
      ? ""
      : phoneError;

  function getGtmLeadPayload() {
    const location = answers.locationText || defaultLocationText || "";
    const city = location.split(",")[0]?.trim() || "";
    const state = answers.state || answers.detectedState;

    return {
      funnel_id: "iul-v5",
      step: currentStep,
      country: "us",
      state: getGtmState(state),
      zip_code: answers.zipCode || undefined,
      city: lowerGtmValue(city),
      location: lowerGtmValue(location),
      age_group: lowerGtmValue(answers.ageGroup),
      insurance_goal: lowerGtmValue(answers.insuranceGoal),
      retirement_age: lowerGtmValue(answers.retirementAge),
      usa_status: lowerGtmValue(answers.usaStatus),
      financial_accounts: lowerGtmValue(answers.financialAccounts.join(", ")),
      first_name: lowerGtmValue(answers.firstName),
      last_name: lowerGtmValue(answers.lastName),
      phone_number: normalizedPhone || undefined,
      email: lowerGtmValue(answers.email),
      ...getUtmParams(),
    };
  }

  useEffect(() => {
    leadUrlRef.current = window.location.href;
  }, []);

  useEffect(() => {
    const storageKey = "bf_iul_v5_eval_code";
    try {
      const existing = window.sessionStorage.getItem(storageKey);
      if (existing) {
        setEvaluationCode(existing);
        return;
      }
    } catch {
      // sessionStorage bloqueado: se genera un código no persistente.
    }

    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "BL-";
    for (let index = 0; index < 5; index += 1) {
      code += charset[Math.floor(Math.random() * charset.length)];
    }
    setEvaluationCode(code);
    try {
      window.sessionStorage.setItem(storageKey, code);
    } catch {
      // sin persistencia; el código solo vive en este render.
    }
  }, []);

  useEffect(() => {
    if (hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      if (phoneValidationTimeoutRef.current !== null) {
        window.clearTimeout(phoneValidationTimeoutRef.current);
      }
      if (loadingIntervalRef.current !== null) {
        window.clearInterval(loadingIntervalRef.current);
      }
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      phoneValidationAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (phoneValidationTimeoutRef.current !== null) {
      window.clearTimeout(phoneValidationTimeoutRef.current);
      phoneValidationTimeoutRef.current = null;
    }
    phoneValidationAbortRef.current?.abort();
    phoneValidationAbortRef.current = null;
    const requestId = ++phoneValidationRequestRef.current;
    setPhoneVerificationToken("");
    setPhoneVerification(null);

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
      pushGtmEvent("phone_verification_started", { funnel_id: "iul-v5" });

      try {
        const response = await fetch("/api/phone-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalizedPhone }),
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => null)) as PhoneVerifyResponse | null;

        if (requestId !== phoneValidationRequestRef.current || controller.signal.aborted) return;

        if (
          response.ok &&
          result?.ok === true &&
          result.normalized === normalizedPhone &&
          result.veriphone &&
          result.verificationToken
        ) {
          setPhoneValidationStatus("valid");
          setPhoneVerification(result.veriphone);
          setPhoneVerificationToken(result.verificationToken);
          setPhoneError("");
          pushGtmEvent("phone_verification_passed", {
            funnel_id: "iul-v5",
            phone_type: result.veriphone.phoneType,
            carrier: result.veriphone.carrier,
            country_code: result.veriphone.countryCode,
          });
          return;
        }

        const reason = result?.reason || "No pudimos verificar el número ahora mismo. Intenta nuevamente.";
        setPhoneValidationStatus("invalid");
        setPhoneError(reason);
        pushGtmEvent("phone_verification_failed", {
          funnel_id: "iul-v5",
          validation_reason: result?.flags?.join(",") || "request_failed",
        });
      } catch (error) {
        if ((error as Error).name === "AbortError" || requestId !== phoneValidationRequestRef.current) return;
        setPhoneValidationStatus("invalid");
        setPhoneError("No pudimos verificar el número ahora mismo. Intenta nuevamente.");
        pushGtmEvent("phone_verification_failed", {
          funnel_id: "iul-v5",
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
  }, [hasBlurredPhone, normalizedPhone]);

  useEffect(() => {
    if (isRejectedPage || currentQuestionIndex < 0) return;

    const trackingKey = `${currentQuestionIndex}:${currentStep}`;
    if (trackedStepsRef.current.has(trackingKey)) return;

    trackedStepsRef.current.add(trackingKey);
    pushGtmEvent(currentQuestionIndex === 0 ? "PageView" : "ViewContent", {
      ...getGtmLeadPayload(),
      event_id: createEventId(currentQuestionIndex === 0 ? "pageview" : "viewcontent"),
      step_number: currentQuestionIndex + 1,
    });
  }, [
    currentQuestionIndex,
    currentStep,
    isRejectedPage,
    answers.state,
    answers.detectedState,
    answers.zipCode,
    answers.ageGroup,
    answers.insuranceGoal,
    answers.retirementAge,
    answers.usaStatus,
    answers.firstName,
    answers.lastName,
    answers.email,
    normalizedPhone,
  ]);

  useEffect(() => {
    if (document.getElementById(trustedFormScriptId)) return;

    const trustedFormScript = document.createElement("script");
    trustedFormScript.id = trustedFormScriptId;
    trustedFormScript.type = "text/javascript";
    trustedFormScript.async = true;
    trustedFormScript.src = `${window.location.protocol}//api.trustedform.com/trustedform.js?field=${encodeURIComponent(
      trustedFormFieldName,
    )}&use_tagged_consent=true&l=${Date.now()}${Math.random()}`;

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(trustedFormScript, firstScript);
  }, []);

  useEffect(() => {
    if (isRejectedPage) return;

    const zipCode = answers.zipCode;

    if (zipCode.length === 0) {
      setAnswers((prev) => ({ ...prev, locationText: defaultLocationText }));
      setIsLookingUpZip(false);
      return;
    }

    if (zipCode.length < 5) {
      setAnswers((prev) => ({
        ...prev,
        locationText: defaultLocationText,
        state: prev.detectedState || "",
      }));
      setIsLookingUpZip(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLookingUpZip(true);

        const response = await fetch(`/api/zip/${zipCode}?strict=zippopotam`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          setAnswers((prev) => ({
            ...prev,
            locationText: defaultLocationText,
            state: prev.state || prev.detectedState,
          }));
          return;
        }

        const data = (await response.json()) as ZipLookupResponse;

        if (isResolvedUsZip(data, zipCode)) {
          if (isBlockedState(data.state)) {
            rejectByNewYork();
            return;
          }

          setAnswers((prev) => ({
            ...prev,
            locationText: data.location || defaultLocationText,
            state: data.state || prev.state || prev.detectedState,
          }));
          return;
        }

        setAnswers((prev) => ({
          ...prev,
          locationText: defaultLocationText,
          state: prev.detectedState || "",
        }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAnswers((prev) => ({
            ...prev,
            locationText: defaultLocationText,
            state: prev.detectedState || "",
          }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLookingUpZip(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [answers.zipCode, defaultLocationText, isRejectedPage]);

  useEffect(() => {
    if (!isRejectedPage) return;

    const rejectedUrl = `${window.location.pathname}${window.location.search}${ageRejectedHash}`;
    if (window.location.hash !== ageRejectedHash) {
      window.history.replaceState({ bfAgeRejected: true }, "", rejectedUrl);
    }

    const keepRejectedView = () => {
      if (!hasAgeRejectedCookie()) return;
      setCurrentStep("rejected");
      if (window.location.hash !== ageRejectedHash) {
        window.history.replaceState({ bfAgeRejected: true }, "", rejectedUrl);
      }
    };

    window.addEventListener("popstate", keepRejectedView);
    window.addEventListener("hashchange", keepRejectedView);
    return () => {
      window.removeEventListener("popstate", keepRejectedView);
      window.removeEventListener("hashchange", keepRejectedView);
    };
  }, [isRejectedPage]);

  useEffect(() => {
    if (!isLoadingStep) return;

    setLoadingProgress(0);
    const startedAt = Date.now();
    loadingIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setLoadingProgress(Math.min(100, Math.round((elapsed / loadingDurationMs) * 100)));
    }, 60);
    loadingTimeoutRef.current = window.setTimeout(() => {
      setLoadingProgress(100);
      pushGtmEvent("v5_qualified", {
        ...getGtmLeadPayload(),
        event_id: createEventId("qualified"),
      });
      transitionTo("call", "forward");
    }, loadingDurationMs);

    return () => {
      if (loadingIntervalRef.current !== null) {
        window.clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [isLoadingStep]);

  function transitionTo(nextStep: FunnelStep, direction: "forward" | "backward") {
    if (isRejectedPage || hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
      return;
    }

    void direction;
    setIsTransitioningOut(true);
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setCurrentStep(nextStep);
      setPanelKey((prev) => prev + 1);
      setSubmitError("");
      setIsTransitioningOut(false);
      transitionTimeoutRef.current = null;
    }, 170);
  }

  function goBack() {
    if (isRejectedPage || hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
      return;
    }

    if (currentStep === "age") {
      return;
    }

    const currentIndex = visibleQuestionSteps.indexOf(currentStep);
    if (currentIndex <= 0) return;
    transitionTo(visibleQuestionSteps[currentIndex - 1], "backward");
  }

  function rejectByAge() {
    setAgeRejectedCookie();

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setAnswers((prev) => ({ ...prev, ageGroup: "65+" }));
    setSubmitError("");
    setPhoneError("");
    setEmailError("");
    setZipError("");
    setIsSubmittingLead(false);
    setIsLookingUpZip(false);
    setIsTransitioningOut(false);
    setCurrentStep("rejected");
    setPanelKey((prev) => prev + 1);
    window.history.replaceState(
      { bfAgeRejected: true },
      "",
      `${window.location.pathname}${window.location.search}${ageRejectedHash}`,
    );
    window.location.replace("/iul-v5/rechazo");
  }

  function rejectByNewYork() {
    setAgeRejectedCookie();

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setSubmitError("");
    setPhoneError("");
    setEmailError("");
    setZipError("");
    setIsSubmittingLead(false);
    setIsLookingUpZip(false);
    setIsTransitioningOut(false);
    setCurrentStep("rejected");
    setPanelKey((prev) => prev + 1);
    window.history.replaceState(
      { bfAgeRejected: true },
      "",
      `${window.location.pathname}${window.location.search}${ageRejectedHash}`,
    );
    window.location.replace("/iul-v5/rechazo");
  }

  function handleDirectChoice<K extends keyof FunnelAnswers>(
    field: K,
    value: FunnelAnswers[K],
    nextStep: FunnelStep
  ) {
    if (isRejectedPage || hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
      return;
    }

    if (field === "ageGroup" && value === "65+") {
      rejectByAge();
      return;
    }

    setAnswers((prev) => ({ ...prev, [field]: value }));
    window.setTimeout(() => {
      transitionTo(nextStep, "forward");
    }, 120);
  }

  function handleUsaStatusChoice(option: string) {
    handleDirectChoice(
      "usaStatus",
      option,
      isCallPathStatus(option) ? "financial" : "zip",
    );
  }

  function toggleFinancialOption(option: string) {
    setAnswers((prev) => {
      const isSelected = prev.financialAccounts.includes(option);

      if (option === financialNoneOption) {
        return {
          ...prev,
          financialAccounts: isSelected ? [] : [financialNoneOption],
        };
      }

      const withoutNone = prev.financialAccounts.filter(
        (item) => item !== financialNoneOption,
      );

      return {
        ...prev,
        financialAccounts: isSelected
          ? withoutNone.filter((item) => item !== option)
          : [...withoutNone, option],
      };
    });
  }

  function handleFinancialContinue() {
    if (answers.financialAccounts.length === 0) return;
    transitionTo("loading", "forward");
  }

  async function handleZipCodeContinue() {
    if (isRejectedPage || hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
      return;
    }

    const zipCode = normalizeZipCode(answers.zipCode);
    const zipValidationMessage = getZipValidationMessage(zipCode);

    if (zipValidationMessage) {
      setZipError(zipValidationMessage);
      return;
    }

    setZipError("");
    setIsLookingUpZip(true);

    try {
      const response = await fetch(`/api/zip/${zipCode}?strict=zippopotam`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Ingresa un ZIP code real de EE.UU.");
      }

      const data = (await response.json()) as ZipLookupResponse;

      if (!isResolvedUsZip(data, zipCode)) {
        throw new Error("Ingresa un ZIP code real de EE.UU.");
      }

      if (isBlockedState(data.state)) {
        rejectByNewYork();
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        zipCode,
        locationText: data.location || defaultLocationText,
        state: data.state || prev.state,
      }));

      transitionTo("name", "forward");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "No pudimos validar ese ZIP code. Intenta otro.";

      setAnswers((prev) => ({
        ...prev,
        zipCode,
        locationText: defaultLocationText,
        state: prev.detectedState || "",
      }));
      setZipError(message);
    } finally {
      setIsLookingUpZip(false);
    }
  }

  async function prepareLeadToken() {
    if (leadToken) return leadToken;

    const tokenResponse = await fetch("/api/lead-token", { cache: "no-store" });

    if (!tokenResponse.ok) {
      throw new Error("No pudimos preparar el envio seguro. Intenta nuevamente.");
    }

    const tokenBody = (await tokenResponse.json().catch(() => null)) as { token?: string } | null;
    const nextLeadToken = tokenBody?.token;

    if (!nextLeadToken) {
      throw new Error("No pudimos preparar el envio seguro. Intenta nuevamente.");
    }

    setLeadToken(nextLeadToken);
    return nextLeadToken;
  }

  async function handleNameContinue() {
    if (!answers.firstName.trim() || !answers.lastName.trim()) return;

    setSubmitError("");
    transitionTo("contact", "forward");

    try {
      await prepareLeadToken();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "No pudimos preparar el envio seguro. Intenta nuevamente.";
      setSubmitError(message);
    }
  }

  async function submitLead() {
    if (isRejectedPage || hasAgeRejectedCookie()) {
      setCurrentStep("rejected");
      return;
    }

    if (!answers.firstName.trim() || !answers.lastName.trim()) return;

    if (
      phoneValidationStatus !== "valid" ||
      !phoneVerification ||
      !phoneVerificationToken ||
      phoneVerification.normalized !== normalizedPhone
    ) {
      setPhoneError(
        phoneValidationStatus === "validating"
          ? "Espera mientras verificamos tu número."
          : "Ingresa un número móvil o fijo contactable.",
      );
      return;
    }

    if (!isValidEmail(answers.email)) {
      setEmailError("Por favor, ingresa un correo válido.");
      return;
    }

    setPhoneError("");
    setEmailError("");
    setSubmitError("");

    if (submittedLeadRef.current) {
      const fallbackParams = new URLSearchParams(window.location.search);
      fallbackParams.set("funnel_id", "iul-v5");
      if (submittedLeadIdRef.current) {
        fallbackParams.set("lead_id", submittedLeadIdRef.current);
      }
      const fallbackSearch = fallbackParams.toString() ? `?${fallbackParams.toString()}` : "";
      window.location.assign(`/thanks/lead${fallbackSearch}`);
      return;
    }

    setIsSubmittingLead(true);

    try {
      const resolvedZipCode = normalizeZipCode(answers.zipCode);
      const zipResponse = await fetch(`/api/zip/${resolvedZipCode}?strict=zippopotam`, {
        cache: "no-store",
      });
      const zipData = zipResponse.ok
        ? ((await zipResponse.json()) as ZipLookupResponse)
        : null;

      if (!isResolvedUsZip(zipData, resolvedZipCode)) {
        setSubmitError("Necesitamos confirmar un ZIP code real para completar la solicitud.");
        transitionTo("zip", "backward");
        return;
      }

      if (isBlockedState(zipData.state)) {
        rejectByNewYork();
        return;
      }

      const resolvedState = zipData.state || "";
      const resolvedLocationText = zipData.location || "";

      const completedAnswers = {
        ...answers,
        zipCode: resolvedZipCode,
        locationText: resolvedLocationText,
        state: resolvedState,
        detectedState: resolvedState,
      };
      const hasCompleteLeadData = [
        completedAnswers.ageGroup,
        completedAnswers.insuranceGoal,
        completedAnswers.retirementAge,
        completedAnswers.usaStatus,
        completedAnswers.state,
        completedAnswers.firstName.trim(),
        completedAnswers.lastName.trim(),
        normalizedPhone,
        completedAnswers.email.trim(),
        completedAnswers.locationText,
        completedAnswers.zipCode,
      ].every(Boolean);

      if (!hasCompleteLeadData) {
        setSubmitError("Necesitamos completar tu ubicación para enviar la solicitud.");
        transitionTo("zip", "backward");
        return;
      }

      setAnswers(completedAnswers);

      const urlParams = new URLSearchParams(window.location.search);
      const sub1 = urlParams.get("sub1")?.trim() || "";
      const sub2 = urlParams.get("sub2")?.trim() || "";
      const adaccountName = urlParams.get("adaccount_name")?.trim() || "";
      const cleanedAnswers = Object.fromEntries(
        Object.entries({
          ageGroup: completedAnswers.ageGroup,
          insuranceGoal: completedAnswers.insuranceGoal,
          retirementAge: completedAnswers.retirementAge,
          usaStatus: completedAnswers.usaStatus,
          state: completedAnswers.state,
          firstName: completedAnswers.firstName.trim(),
          lastName: completedAnswers.lastName.trim(),
          phoneNumber: normalizedPhone,
          email: completedAnswers.email.trim(),
          locationText: completedAnswers.locationText,
          zipCode: completedAnswers.zipCode,
          sub1,
          sub2,
        }).filter(([, value]) => value !== "" && value != null)
      );
      const preparedLeadToken = await prepareLeadToken();

      const response = await fetch("/api/lead-iul-v5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-lead-token": preparedLeadToken,
        },
        body: JSON.stringify({
          page: "/iul-v5",
          answers: cleanedAnswers,
          meta: {
            deviceId: getOrCreateDeviceId(),
            trustedFormCertUrl: getTrustedFormCertUrl(),
            salePath: "lead",
            adaccountName,
            leadUrl: leadUrlRef.current || window.location.href,
            phoneVerification,
            phoneVerificationToken,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error || "No pudimos enviar tu solicitud ahora mismo.");
      }

      const responseBody = (await response.json().catch(() => null)) as {
        leadId?: string;
      } | null;
      const leadId = responseBody?.leadId;
      submittedLeadRef.current = true;
      submittedLeadIdRef.current = leadId || "";
      const leadEventId = createEventId("lead");
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set("funnel_id", "iul-v5");
      if (leadId) {
        nextParams.set("lead_id", leadId);
      }
      nextParams.set("first_name", completedAnswers.firstName.trim());
      nextParams.set("insurance_goal", completedAnswers.insuranceGoal);

      const nextSearch = nextParams.toString() ? `?${nextParams.toString()}` : "";

      pushGtmEvent("Lead", {
        ...getGtmLeadPayload(),
        event_id: leadEventId,
        lead_id: leadId,
        external_id: leadId,
      });

      setLeadToken("");
      window.location.assign(`/thanks/lead${nextSearch}`);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "No pudimos enviar tu solicitud ahora mismo. Intenta nuevamente.";
      setSubmitError(message);
    } finally {
      setIsSubmittingLead(false);
    }
  }

  function handleCallClick() {
    pushGtmEvent("Contact", {
      ...getGtmLeadPayload(),
      event_id: createEventId("contact"),
    });
  }

  function renderProgress() {
    if (progress == null) {
      return <div className="h-[8px] w-full max-w-[300px]" />;
    }

    return (
      <div className="relative w-full max-w-[300px] overflow-hidden rounded-full bg-[#d9d9d9]">
        <div
          className="h-[8px] rounded-full bg-[var(--brand)] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
        {visibleQuestionSteps.slice(1).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute top-0 h-full w-px bg-white/55"
            style={{ left: `${((index + 1) / visibleQuestionSteps.length) * 100}%` }}
          />
        ))}
      </div>
    );
  }

  function renderRejectedPage() {
    return (
      <section
        className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[760px] items-center justify-center px-4 py-10 text-center"
        style={{ fontFamily: '"Montserrat", "HurmeGeo", Arial, sans-serif' }}
      >
        <div className="w-full rounded-[18px] border border-[#dbe7f5] bg-white px-6 py-10 shadow-[0_18px_45px_rgba(18,31,53,0.12)] md:px-10 md:py-12">
          <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#eef6ff] text-[var(--brand)]">
            <ShieldCheckIcon className="h-[28px] w-[28px]" />
          </div>
          <h1 className="mx-auto mt-6 max-w-[560px] text-[28px] font-extrabold leading-[1.14] tracking-[-0.04em] text-[#101820] md:text-[40px]">
            Gracias por tu interes
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-[#5d6674] md:text-[19px]">
            Actualmente este beneficio no esta disponible para tu grupo de edad.
            Si en el futuro abrimos nuevas opciones, nos encantara ayudarte a revisarlas.
          </p>
        </div>
      </section>
    );
  }

  function renderLoadingPanel() {
    const visibleChecks = Math.min(
      loadingChecklist.length,
      Math.floor((loadingProgress / 100) * (loadingChecklist.length + 1)),
    );

    return (
      <div
        key={`loading-${panelKey}`}
        className="mx-auto flex w-full max-w-[520px] animate-[fade-up_0.55s_ease-out] flex-col items-center px-2 pt-10 text-center md:pt-16"
        style={{ fontFamily: '"Montserrat", "HurmeGeo", Arial, sans-serif' }}
      >
        <span
          aria-hidden="true"
          className="h-[54px] w-[54px] rounded-full border-4 border-[#dbe7f5] border-t-[var(--brand)] animate-spin"
        />
        <h2 className="mt-6 text-[26px] leading-[1.2] font-extrabold tracking-[-0.04em] text-[#101820] md:text-[34px]">
          Analizando tus respuestas...
        </h2>
        <div className="mt-6 w-full max-w-[360px] overflow-hidden rounded-full bg-[#d9d9d9]">
          <div
            className="h-[10px] rounded-full bg-[var(--brand)] transition-[width] duration-150"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <div className="mt-7 grid w-full max-w-[380px] gap-3 text-left">
          {loadingChecklist.map((item, index) => (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3 shadow-[0_4px_10px_rgba(16,24,32,0.06)] transition ${
                index < visibleChecks ? "border-[#bde5cd] opacity-100" : "border-[#e5e7eb] opacity-45"
              }`}
            >
              <span className={index < visibleChecks ? "text-[#18bf79]" : "text-[#cbd5e1]"}>
                <FilledCheckIcon className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#101820]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCallPanel() {
    return (
      <div
        key={`call-${panelKey}`}
        className="mx-auto w-full max-w-[520px] animate-[fade-up_0.55s_ease-out] px-2 pt-6 text-center md:pt-10"
        style={{ fontFamily: '"Montserrat", "HurmeGeo", Arial, sans-serif' }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#18bf79] text-white shadow-[0_10px_24px_rgba(24,191,121,0.25)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <path
              d="m5.5 12.8 4.3 4.3L18.5 7.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-[14px] font-extrabold tracking-[-0.01em] text-[#18bf79]">
          ¡Felicidades{answers.firstName ? `, ${answers.firstName}` : ""}! Basado en tus respuestas
        </p>
        <h2 className="mx-auto mt-2 max-w-[460px] text-[28px] leading-[1.16] font-extrabold tracking-[-0.04em] text-[#101820] md:text-[38px]">
          Podrías ser aprobado hoy mismo
        </h2>
        <p className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#9aa3b2]">
          Tu número de evaluación
        </p>
        <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[16px] font-black tracking-[0.12em] text-[#101820]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#18bf79]" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="m7.8 12.2 2.6 2.6 5.8-6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{evaluationCode || "BL-·····"}</span>
        </div>
        <p className="mx-auto mt-4 max-w-[420px] text-[15px] leading-[1.5] font-bold text-[#101820] md:text-[16px]">
          Recuerda que para calificar,{" "}
          <span className="font-black text-[#e11d48] underline underline-offset-2">
            tienes que llamar.
          </span>
        </p>

        <a
          href={`tel:${ppcPhoneNumber}`}
          onClick={handleCallClick}
          className="mt-7 inline-flex w-full max-w-[420px] flex-col items-center justify-center gap-1 rounded-[50px] bg-[#18bf79] px-8 py-[18px] text-white shadow-[0_10px_20px_rgba(24,191,121,0.3)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(24,191,121,0.38)]"
        >
          <span className="inline-flex items-center gap-2 text-[22px] leading-[1.1] font-extrabold md:text-[26px]">
            <PhoneIcon className="h-6 w-6" />
            {ppcPhoneDisplay}
          </span>
          <span className="text-[13px] font-semibold text-[#eafff5] md:text-[14px]">
            Toca para llamar - Llamada gratuita
          </span>
        </a>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff1b8] px-4 py-2 text-[13px] font-extrabold tracking-[-0.02em] text-[#7b4a10]">
          <BoltIcon className="h-4 w-4 text-[#f94848]" />
          Asesores disponibles ahora - Espera menor a 1 minuto
        </div>

        <div className="mt-7 grid w-full gap-3 text-left">
          {callBenefits.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-[14px] border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(16,24,32,0.05)]"
            >
              <span className="mt-0.5 inline-flex text-[#18bf79]">
                <BadgeCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-black tracking-[-0.03em] text-[#13213c]">
                  {item.title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.4] text-[#5d6782]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  }

  function renderQuestionnairePanel() {
    return (
      <div key={`panel-${panelKey}`} className="w-full">
        <div className="mx-auto flex w-full max-w-[760px] flex-col items-center">
          <div className="flex w-full items-center justify-between gap-3 md:gap-4">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="inline-flex h-9 w-9 items-center justify-center text-[#6b7280] [font-size:0] transition hover:text-[#101820]"
            >
              <BackArrowIcon className="h-[18px] w-[18px]" />
            </button>
            {renderProgress()}
            <div className="flex w-[58px] shrink-0 justify-end md:w-[70px]">
              <span className="whitespace-nowrap text-[12px] font-black tracking-[-0.02em] text-[var(--brand-dark)] md:text-[13px]">
                {progressLabel}
              </span>
            </div>
          </div>

          <div className={`mt-5 text-center md:mt-6 ${animationClass}`}>
            {currentStep === "age" ? (
              <p className="mx-auto mb-1 max-w-[520px] text-[14px] font-extrabold uppercase tracking-[0.04em] text-[var(--brand)] md:mb-1.5 md:text-[16px]">
                Aplica para los beneficios IUL
              </p>
            ) : null}
            <h2
              className={`mx-auto max-w-[720px] font-bold tracking-[-0.05em] text-[#101820] ${
                currentStep === "financial"
                  ? "text-[22px] leading-[1.18] md:text-[38px]"
                  : "text-[30px] leading-[1.16] md:text-[46px]"
              }`}
            >
              {currentStep === "age" && "¿En qué grupo de edad estás?"}
              {currentStep === "goal" &&
                "Cuéntame, ¿qué te gustaría lograr con un seguro de vida?"}
              {currentStep === "retirement" && "¿A qué edad te gustaría jubilarte?"}
              {currentStep === "status" && "¿Cuál es tu situación en Estados Unidos?"}
              {currentStep === "financial" &&
                "¿Cómo estás preparando hoy tu futuro financiero?"}
              {currentStep === "zip" && "Cual es tu ZIP code?"}
              {currentStep === "name" && "¿Cuál es tu nombre completo?"}
              {currentStep === "contact" &&
                "¿A qué número te enviamos tu cotización personalizada?"}
            </h2>
            {currentStep === "financial" ? (
              <p className="mx-auto mt-2 max-w-[520px] text-[12.5px] leading-[1.4] text-[#5d6674] md:mt-3 md:text-[16px]">
                Selecciona las cuentas o inversiones que actualmente tienes.
                Puedes elegir más de una opción.
              </p>
            ) : null}
          </div>

          {currentStep === "age" ? (
            <div className={`mt-8 grid w-full max-w-[420px] gap-4 md:mt-10 ${animationClass}`}>
              {ageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDirectChoice("ageGroup", option, "goal")}
                  className={optionButtonClass(
                    answers.ageGroup === option,
                    option === recommendedAgeOption
                  ) + " justify-center text-center"}
                >
                  <span className="inline-flex items-center justify-center gap-2 font-black tracking-[-0.02em]">
                    <DialFingerIcon className="h-[23px] w-[23px] text-[#5d6674]" />
                    <span>{option}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {currentStep === "goal" ? (
            <div className={`mt-8 grid w-full max-w-[460px] gap-4 md:mt-10 ${animationClass}`}>
              {goalOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDirectChoice("insuranceGoal", option, "retirement")}
                  className={optionButtonClass(
                    answers.insuranceGoal === option,
                    option === recommendedGoalOption
                  ) + " justify-center text-center"}
                >
                  {option === "Seguro de vida" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <ShieldCheckIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : option === "Ahorrar e invertir" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <StatisticGrowIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : option.normalize("NFC") === "Planificación de retiro" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <RetirementPlanIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : option.normalize("NFC") === "No estoy seguro aún" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <UnsureIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : (
                    option
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {currentStep === "retirement" ? (
            <div className={`mt-8 grid w-full max-w-[460px] gap-4 md:mt-10 ${animationClass}`}>
              {retirementOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDirectChoice("retirementAge", option, "status")}
                  className={optionButtonClass(answers.retirementAge === option) + " justify-center text-center"}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <RetirementPlanIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                    <span>{option}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {currentStep === "status" ? (
            <div className={`mt-8 grid w-full max-w-[460px] gap-4 md:mt-10 ${animationClass}`}>
              {usaStatusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleUsaStatusChoice(option)}
                  className={optionButtonClass(answers.usaStatus === option) + " justify-center text-center"}
                >
                  {option === "Ciudadano Americano" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <FlagIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : option === "Residente Permanente" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <DoubleCheckIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <QuestionMarkIcon className="h-[22px] w-[22px] text-[#5d6674]" />
                      <span>{option}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {currentStep === "financial" ? (
            <div className={`mt-4 flex w-full max-w-[460px] flex-col gap-3 md:mt-8 md:gap-4 ${animationClass}`}>
              <div className="grid w-full grid-cols-2 gap-2 md:gap-3">
                {financialOptions.map((option) => {
                  const isSelected = answers.financialAccounts.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleFinancialOption(option)}
                      className={[
                        "flex min-h-[52px] w-full items-center gap-2 rounded-[14px] border bg-white px-3 py-2 text-left text-[13px] leading-[1.2] tracking-[-0.02em] text-[#101820] shadow-[0_4px_10px_rgba(16,24,32,0.08)] transition md:min-h-[58px] md:gap-3 md:px-4 md:text-[15px]",
                        isSelected
                          ? "border-[var(--brand)] bg-[#f3f8ff] shadow-[0_0_0_1px_var(--brand),0_8px_18px_rgba(26,115,232,0.12)]"
                          : "border-[#9c9c9c] hover:border-[#6f6f6f]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border-2 transition md:h-[24px] md:w-[24px] md:rounded-[7px] ${
                          isSelected
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-[#9c9c9c] bg-white text-transparent"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] md:h-[15px] md:w-[15px]" fill="none">
                          <path
                            d="m6 12.5 4 4L18 8"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleFinancialContinue}
                disabled={answers.financialAccounts.length === 0}
                className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[17px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--brand-dark)] md:h-[54px] md:text-[18px]"
              >
                <span>Seguir</span>
                <NextArrowIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          {currentStep === "zip" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
              <input
                id="zip-code"
                name="postal-code"
                value={answers.zipCode}
                onChange={(event) => {
                  const zipCode = normalizeZipCode(event.target.value);
                  setAnswers((prev) => ({
                    ...prev,
                    zipCode,
                    state: zipCode === prev.zipCode ? prev.state : prev.detectedState || "",
                  }));
                  setZipError("");
                }}
                placeholder="Ej: 33101"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                enterKeyHint="done"
                className="h-[58px] rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
              />

              <p className="min-h-[22px] text-[14px] text-[#6b7280]">
                {resolvedUsState
                  ? `Estado detectado: ${resolvedUsState}`
                  : "Usamos tu ZIP code para identificar tu estado."}
              </p>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {zipError}
              </p>

              <button
                type="button"
                onClick={() => void handleZipCodeContinue()}
                disabled={isLookingUpZip || normalizeZipCode(answers.zipCode).length !== 5}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--brand-dark)]"
              >
                <span>{isLookingUpZip ? "Validando ZIP code..." : "Confirmar ZIP code"}</span>
                {isLookingUpZip ? (
                  <span
                    aria-hidden="true"
                    className="h-[16px] w-[16px] rounded-full border-2 border-white/35 border-t-white animate-spin"
                  />
                ) : (
                  <NextArrowIcon className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          ) : null}

          {currentStep === "name" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
              <input
                id="first-name"
                name="given-name"
                value={answers.firstName}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    firstName: event.target.value,
                  }))
                }
                placeholder="Nombre"
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                className="h-[58px] rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
              />
              <input
                id="last-name"
                name="family-name"
                value={answers.lastName}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Apellido"
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                className="h-[58px] rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
              />

              <button
                type="button"
                onClick={() => void handleNameContinue()}
                disabled={!answers.firstName.trim() || !answers.lastName.trim()}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--brand-dark)]"
              >
                <span>Seguir</span>
                <NextArrowIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          {currentStep === "contact" ? (
            <form
              className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}
              data-tf-element-role="offer"
              onSubmit={(event) => {
                event.preventDefault();
                void submitLead();
              }}
            >
              <input type="hidden" name={trustedFormFieldName} />
              <div className="flex gap-3">
                <select
                  value={answers.phoneCountry}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      phoneCountry: event.target.value,
                    }))
                  }
                  className="h-[58px] min-w-[106px] rounded-[16px] border border-[#9c9c9c] bg-white px-4 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
                >
                  <option value="US">US +1</option>
                </select>

                <div className="relative min-w-0 flex-1">
                  <input
                    id="phone-number"
                    name="tel"
                    value={formatPhoneDigits(answers.phoneNumber)}
                    onChange={(event) => {
                      phoneValidationRequestRef.current += 1;
                      phoneValidationAbortRef.current?.abort();
                      if (phoneValidationTimeoutRef.current !== null) {
                        window.clearTimeout(phoneValidationTimeoutRef.current);
                        phoneValidationTimeoutRef.current = null;
                      }
                      setAnswers((prev) => ({
                        ...prev,
                        phoneNumber: normalizeUsPhoneInput(event.target.value),
                      }));
                      setHasBlurredPhone(false);
                      setPhoneValidationStatus("idle");
                      setPhoneVerification(null);
                      setPhoneVerificationToken("");
                      setPhoneError("");
                    }}
                    onInput={(event) => {
                      const nextPhone = normalizeUsPhoneInput(event.currentTarget.value);
                      phoneValidationRequestRef.current += 1;
                      phoneValidationAbortRef.current?.abort();
                      if (nextPhone !== answers.phoneNumber) {
                        setAnswers((prev) => ({
                          ...prev,
                          phoneNumber: nextPhone,
                        }));
                      }
                      setHasBlurredPhone(false);
                      setPhoneValidationStatus("idle");
                      setPhoneVerification(null);
                      setPhoneVerificationToken("");
                      setPhoneError("");
                    }}
                    onBlur={() => {
                      if (normalizedPhone.length !== 10) setHasBlurredPhone(true);
                    }}
                    placeholder="000 000 0000"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    aria-invalid={phoneValidationStatus === "invalid" || !!phoneError}
                    aria-describedby="phone-validation-message"
                    aria-busy={phoneValidationStatus === "validating"}
                    className={`h-[58px] w-full rounded-[16px] border bg-white px-5 pr-12 text-[17px] text-[#101820] outline-none transition ${phoneBorderClass}`}
                  />
                  {phoneValidationStatus !== "idle" ? (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      <PhoneStatusIcon status={phoneValidationStatus} />
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#6b7280]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16v10H4z" /><path d="m4 8 8 6 8-6" /></svg>
                </span>
                <input
                  id="email"
                  name="email"
                  value={answers.email}
                  onChange={(event) => {
                    setAnswers((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }));
                    setEmailError("");
                  }}
                  placeholder="Ej: correo@ejemplo.com"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  className="h-[58px] w-full rounded-[16px] border border-[#9c9c9c] bg-white pl-12 pr-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
                />
              </div>

              <p
                id="phone-validation-message"
                className="min-h-[22px] text-[14px] text-[#d14c4c]"
                role={phoneValidationStatus === "invalid" ? "alert" : undefined}
              >
                {visiblePhoneError}
              </p>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {emailError}
              </p>

              <button
                type="submit"
                name="submit-lead"
                data-tf-element-role="submit"
                disabled={isSubmittingLead || phoneValidationStatus !== "valid"}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 hover:bg-[var(--brand-dark)]"
              >
                <span>Ver mi cotización ahora</span>
                {isSubmittingLead ? (
                  <span
                    aria-hidden="true"
                    className="h-[16px] w-[16px] rounded-full border-2 border-white/35 border-t-white animate-spin"
                  />
                ) : (
                  <NextArrowIcon className="h-[18px] w-[18px]" />
                )}
              </button>

              <p
                className="-mt-1 text-center text-[11px] leading-[1.45] text-[#6b7280]"
                data-tf-element-role="consent-language"
              >
                Al hacer clic en <strong>“Ver mi cotización ahora”</strong>, doy mi consentimiento expreso por escrito y mi firma electrónica para que <strong>Best Life</strong>, sus{" "}
                <Link href="/socios" className="font-bold text-[#4b5563] underline underline-offset-2">
                  socios de mercadeo y aseguradoras licenciadas
                </Link>{" "}
                y cualquier persona que llame o envíe mensajes en su nombre, me contacten al número de teléfono y correo electrónico proporcionados incluso si están en alguna lista “No Llamar” estatal, federal o interna con fines de mercadeo de seguros de vida, IUL, gastos finales y productos financieros relacionados. Acepto que dichas comunicaciones pueden hacerse mediante{" "}
                <strong>sistemas de marcación automática, marcadores predictivos, mensajes de voz pregrabada o artificial (incluyendo IA), y SMS automatizados.</strong>{" "}
                Pueden aplicar tarifas estándar de mensajes y datos. <strong>Entiendo que este consentimiento no es condición para comprar ningún producto</strong> y que puedo revocarlo en cualquier momento respondiendo <strong>STOP</strong> a un SMS o usando el enlace de cancelación en los correos. He leído y acepto la{" "}
                <Link href="/privacy" className="font-bold text-[#4b5563] underline underline-offset-2">
                  Política de Privacidad
                </Link>{" "}
                y los{" "}
                <Link href="/terms" className="font-bold text-[#4b5563] underline underline-offset-2">
                  Términos de Uso
                </Link>.
              </p>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {submitError}
              </p>
            </form>
          ) : null}

          <div className="mt-12 flex w-full max-w-[420px] items-center justify-center gap-4 md:mt-14">
            {questionnaireSecuritySeals.map((seal) => (
              <div
                key={seal.src}
                className="flex h-[28px] items-center justify-center opacity-90 grayscale-[0.08]"
              >
                <Image
                  src={seal.src}
                  alt={seal.alt}
                  width={seal.width}
                  height={seal.height}
                  className="h-auto max-h-[28px] w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" alt="" />
      </noscript>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap");
      `}</style>
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
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#191919] md:absolute md:right-4">
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

      {isRejectedPage ? (
        renderRejectedPage()
      ) : (
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-3 pb-4 pt-8 md:px-4 md:pb-6 md:pt-4">
          <section className="flex w-full flex-col items-center justify-start">
            <div className="w-full">
              {isLoadingStep
                ? renderLoadingPanel()
                : isCallStep
                  ? renderCallPanel()
                  : renderQuestionnairePanel()}
            </div>
          </section>
        </div>
      )}
      <footer className="px-4 pb-5 pt-3 text-center text-[9px] leading-[1.45] text-[#b8bec8] md:text-[10px]">
        <p>© 2025 Best Life. All Rights Reserved.</p>
        <p className="mx-auto mt-2 max-w-[920px]">
          Best Life es una plataforma independiente de información sobre seguros IUL. No somos una aseguradora. Los asesores mencionados están certificados y regulados por el departamento de seguros de su estado.
        </p>
        <p className="mx-auto mt-2 max-w-[920px]">
          This site is not part of Facebook or Meta Platforms, Inc., and is not sponsored, affiliated with, endorsed, or administered by Facebook in any way. The content on this site has not been reviewed, approved, or certified by Facebook or any of its related entities. “Facebook” is a registered trademark of Meta Platforms, Inc.
        </p>
      </footer>
    </main>
  );
}
