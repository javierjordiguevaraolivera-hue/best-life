"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getDetectedZipCode } from "@/lib/quotify-us";

const ageOptions = ["25 a 34", "35 a 44", "45 a 54", "55 a 65", "65 +"];
const goalOptions = ["Seguro de vida", "Ahorrar e invertir", "Planificación de retiro", "No estoy seguro aún"];
const stateOptions = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];
const logos = [
  "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/2b2dd817-519b-4607-8464-4b22da3e26c6/original.png",
  "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/31f97c95-e61e-4deb-bd40-fb60592dc32e/original.jpeg",
  "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/83fc0fa0-6378-4d05-849d-ec3af071431c/original.jpeg",
  "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/4e4206b8-e4c4-4bb8-9930-19ac536d4d09/original.avif",
];

type Step = "age" | "goal" | "location" | "name" | "phone" | "email" | "success" | "disqualified";
type Answers = {
  ageGroup: string;
  insuranceGoal: string;
  state: string;
  detectedState: string;
  zipCode: string;
  locationText: string;
  userCityState: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  consent: boolean;
  sub4: string;
  sub11: string;
  queryParams: Record<string, string>;
  queryParamsAll: Record<string, string[]>;
};
type LocationResponse = { location?: string; state?: string | null; zipCode?: string | null };
type LeadSubmitResponse = {
  ok?: boolean;
  forwarded?: boolean;
  error?: string;
};
type SubmittedLead = {
  ageGroup: string;
  insuranceGoal: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  phoneNumber: string;
  email: string;
  state: string;
  detectedState: string;
  detectedZipCode: string;
  zipCode: string;
  city: string;
  locationText: string;
  userCityState: string;
  sub4: string;
  sub11: string;
  consent: boolean;
  queryParams: Record<string, unknown>;
  queryParamsAll: Record<string, unknown>;
};

const emptyAnswers: Answers = {
  ageGroup: "",
  insuranceGoal: "",
  state: "",
  detectedState: "",
  zipCode: "",
  locationText: "",
  userCityState: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
  consent: false,
  sub4: "",
  sub11: "",
  queryParams: {},
  queryParamsAll: {},
};

const progressMap: Partial<Record<Step, { filled: number; total: number; label: string }>> = {
  goal: { filled: 2, total: 6, label: "Progreso: 32%" },
  location: { filled: 3, total: 6, label: "Progreso: 52%" },
  name: { filled: 4, total: 6, label: "Progreso: 67%" },
  phone: { filled: 5, total: 6, label: "Progreso: 88%" },
  email: { filled: 19, total: 20, label: "Progreso: 97%" },
};

const steps: Step[] = ["age", "goal", "location", "name", "phone", "email", "success", "disqualified"];
const storageKey = "quotify-us2-funnel-v1";
const deviceStorageKey = "best-money-device-id";
const formId = "quotify-us2-form";
const formName = "quotify_us_life_insurance_form";

function normalizeZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("1")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

function extractCity(locationText: string) {
  const value = locationText.trim();
  if (!value) return "";
  const city = value.split(",")[0]?.trim() || "";
  if (!city || /rates available/i.test(city)) return "";
  return city;
}

function formatPhone(value: string) {
  const digits = normalizePhone(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function phoneErrorMessage(value: string) {
  const digits = normalizePhone(value);
  if (digits.length !== 10) return "Por favor, ingresa un número de teléfono válido.";

  const areaCode = digits.slice(0, 3);
  const exchangeCode = digits.slice(3, 6);
  const lineNumber = digits.slice(6);
  const uniqueDigits = new Set(digits).size;

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return "Por favor, ingresa un número registrado.";

  if (
    digits === "0123456789" ||
    digits === "1234567890" ||
    digits === "0987654321" ||
    digits === "9876543210" ||
    digits === "1122334455" ||
    digits === "1212121212" ||
    digits === "1231231234" ||
    digits === "1234512345" ||
    /^(\d)\1{9}$/.test(digits) ||
    /^(\d{2})\1{4}$/.test(digits) ||
    /^(\d{5})\1$/.test(digits) ||
    uniqueDigits < 4 ||
    areaCode === "555" ||
    exchangeCode === "555" ||
    areaCode === "000" ||
    exchangeCode === "000" ||
    lineNumber === "0000" ||
    /^[2-9]11$/.test(areaCode) ||
    /^[2-9]11$/.test(exchangeCode) ||
    /^(\d)\1{3}$/.test(lineNumber)
  ) {
    return "Por favor, ingresa un número registrado.";
  }

  return "";
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function getOrCreateDeviceId() {
  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) return existing;
  const id = `bm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(deviceStorageKey, id);
  return id;
}

function normalizeHashValue(value: string, mode: "text" | "email" | "phone" | "zip" = "text") {
  if (mode === "email") return value.trim().toLowerCase();
  if (mode === "phone") return normalizePhone(value);
  if (mode === "zip") return normalizeZip(value);
  return value.trim().toLowerCase();
}

async function sha256Hex(value: string) {
  if (!value || typeof window === "undefined" || !window.crypto?.subtle) return "";
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildLeadGeneratedEvent(page: string, lead: SubmittedLead) {
  const email = normalizeHashValue(lead.email, "email");
  const phone = normalizeHashValue(lead.phone, "phone");
  const firstName = normalizeHashValue(lead.firstName, "text");
  const lastName = normalizeHashValue(lead.lastName, "text");
  const fullName = normalizeHashValue(lead.fullName, "text");
  const state = normalizeHashValue(lead.state || lead.detectedState, "text");
  const city = normalizeHashValue(lead.city, "text");
  const detectedZipCode = normalizeHashValue(lead.detectedZipCode || lead.zipCode, "zip");

  const [emailHash, phoneHash, firstNameHash, lastNameHash, fullNameHash, stateHash, cityHash, detectedZipCodeHash] = await Promise.all([
    sha256Hex(email),
    sha256Hex(phone),
    sha256Hex(firstName),
    sha256Hex(lastName),
    sha256Hex(fullName),
    sha256Hex(state),
    sha256Hex(city),
    sha256Hex(detectedZipCode),
  ]);

  return {
    event: "leadgenerated",
    funnel: "quotify-us2",
    form_id: formId,
    form_name: formName,
    page_path: page,
    age_group: lead.ageGroup,
    insurance_goal: lead.insuranceGoal,
    first_name: lead.firstName,
    first_name_hash: firstNameHash,
    last_name: lead.lastName,
    last_name_hash: lastNameHash,
    full_name: lead.fullName,
    full_name_hash: fullNameHash,
    email: lead.email,
    email_hash: emailHash,
    phone: lead.phone,
    phone_hash: phoneHash,
    state: lead.state || lead.detectedState,
    state_hash: stateHash,
    city: lead.city,
    city_hash: cityHash,
    detected_zip_code: lead.detectedZipCode || lead.zipCode,
    detected_zip_code_hash: detectedZipCodeHash,
    location_text: lead.locationText,
    sub4: lead.sub4,
    sub11: lead.sub11,
  };
}

function pushToDataLayer(eventPayload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const dataLayerWindow = window as Window & { dataLayer?: Record<string, unknown>[] };
  dataLayerWindow.dataLayer = dataLayerWindow.dataLayer || [];
  dataLayerWindow.dataLayer.push(eventPayload);
}

async function resolveLocationSnapshot(currentAnswers: Answers) {
  let resolvedZipCode = normalizeZip(currentAnswers.zipCode);
  let resolvedLocationText = currentAnswers.locationText.trim();
  let resolvedState = (currentAnswers.state || currentAnswers.detectedState).trim();
  let resolvedDetectedState = currentAnswers.detectedState.trim();

  if (!resolvedZipCode || !resolvedLocationText || !resolvedState) {
    try {
      const locationResponse = await fetch("/api/location", { cache: "no-store" });

      if (locationResponse.ok) {
        const locationData = (await locationResponse.json()) as {
          location?: string;
          zipCode?: string | null;
          state?: string | null;
        };

        resolvedLocationText = resolvedLocationText || String(locationData.location || "");
        resolvedState = resolvedState || String(locationData.state || "");
        resolvedDetectedState = resolvedDetectedState || String(locationData.state || "");
        resolvedZipCode = getDetectedZipCode({
          explicitZip: resolvedZipCode,
          geoZip: locationData.zipCode || null,
          state: resolvedState || resolvedDetectedState,
        });
      }
    } catch {
      resolvedZipCode = getDetectedZipCode({
        explicitZip: resolvedZipCode,
        geoZip: null,
        state: resolvedState || resolvedDetectedState,
      });
    }
  }

  if (!resolvedZipCode) {
    resolvedZipCode = getDetectedZipCode({
      explicitZip: currentAnswers.zipCode,
      geoZip: null,
      state: resolvedState || resolvedDetectedState,
    });
  }

  return {
    resolvedZipCode,
    resolvedLocationText,
    resolvedState,
    resolvedDetectedState,
  };
}

function Progress({ filled, total, label }: { filled: number; total: number; label: string }) {
  const parsedPercent = Number(label.match(/(\d+)/)?.[1] ?? "");
  const percent = Number.isFinite(parsedPercent) && parsedPercent > 0 ? parsedPercent : Math.round((filled / total) * 100);

  return (
    <div className="space-y-[10px]">
      <div className="h-[10px] overflow-hidden rounded-full bg-[#ebeef3]">
        <div className="h-full rounded-full bg-[#ff6a13]" style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }} />
      </div>
      <p className="text-center text-[15px] text-[#111827]">{label}</p>
    </div>
  );
}

function formatDetectedRegion(locationText: string, detectedState: string, fallbackCity?: string) {
  if (fallbackCity) return `${fallbackCity} region`;
  const primary = locationText.split(",")[0]?.trim();
  if (primary && !/rates available/i.test(primary)) return primary;
  if (detectedState) return detectedState;
  return "Ubicación detectada";
}

function HandDialIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[34px] w-[34px] text-current">
      <path d="M1.875,1.5a.375.375,0,1,0,.375.375A.375.375,0,0,0,1.875,1.5h0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="1.5" x2="7.125" y2="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125,1.5a.375.375,0,1,0,.375.375A.375.375,0,0,0,7.125,1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="12.375" y1="1.5" x2="12.375" y2="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12.375,1.5a.375.375,0,1,0,.375.375.375.375,0,0,0-.375-.375" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="1.875" y1="6.75" x2="1.875" y2="6.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M1.875,6.75a.375.375,0,1,0,.375.375.375.375,0,0,0-.375-.375" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="6.75" x2="7.125" y2="6.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125,6.75a.375.375,0,1,0,.375.375.375.375,0,0,0-.375-.375" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="1.875" y1="12" x2="1.875" y2="12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M1.875,12a.375.375,0,1,0,.375.375A.375.375,0,0,0,1.875,12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <line x1="7.125" y1="12" x2="7.125" y2="12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.125,12a.375.375,0,1,0,.375.375A.375.375,0,0,0,7.125,12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6.75,22.5l-1.9-3.327A2.263,2.263,0,0,1,8.7,16.8l1.8,2.7V8.25a2.25,2.25,0,0,1,4.5,0V16.5h3.379A4.332,4.332,0,0,1,22.5,20.847V22.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[16px] border px-4 py-[13px] text-left transition ${
        selected
          ? "border-[#3a9be7] bg-[#3a9be7] text-white"
          : "border-[#dfe3e8] bg-white text-[#111827] hover:border-[#cfd6dd]"
      }`}
    >
      <div className="flex items-center justify-center gap-3">
        <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center ${selected ? "text-white" : "text-[#7a869a]"}`}>
          <HandDialIcon />
        </div>
        <div className="text-[16px] font-bold tracking-[-0.02em]">{label}</div>
      </div>
    </button>
  );
}

function LogoBar() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-7">
      {logos.map((src) => (
        <div key={src} className="flex h-[60px] items-center justify-center">
          <img src={src} alt="Partner logo" className="max-h-[38px] w-auto object-contain" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function InlineTrustLogos() {
  return (
    <div className="mt-8 grid grid-cols-4 items-center gap-3">
      {logos.map((src) => (
        <div key={src} className="flex h-[42px] items-center justify-center">
          <img src={src} alt="Partner logo" className="max-h-[34px] w-auto object-contain" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function FooterLegal() {
  return (
    <footer className="px-4 pb-12 pt-8 text-center text-[#5d6471]">
      <a href="https://terminos-y-condiciones.quotify.us/#terminos-y-condiciones" target="_blank" rel="noreferrer" className="text-[13px] underline underline-offset-2">
        Terminos y condiciones - Políticas de privacidad
      </a>
      <div className="mt-6 space-y-4 text-[11px] leading-[1.6]">
        <p className="font-semibold text-[#273041]">© 2025 Quotify. All Rights Reserved.</p>
        <p>This site is not part of Facebook or Meta Platforms, Inc. Additionally, this site is not endorsed by Facebook in any way. "Facebook" is a registered trademark of Meta Platforms, Inc.</p>
        <p>Vida+ is an independent lead generation and marketing service provider. This website and the services offered are not sponsored, affiliated with, endorsed, or administered by Facebook. The content on this site has not been reviewed, approved, or certified by Facebook or any of its subsidiaries.</p>
      </div>
    </footer>
  );
}

function DisqualifiedPage({ onRefer }: { onRefer: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-[#f3f6f8] px-0 py-[5px]">
      <div className="mx-auto w-full max-w-[482px] overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
        <section className="bg-[#ff474b] px-5 pb-[18px] pt-[23px] text-center text-white">
          <div className="text-[24px] leading-none">⚠️</div>
          <h1 className="mt-[10px] font-['Poppins',sans-serif] text-[20px] font-extrabold leading-[1.2]">
            No calificas para este programa
          </h1>
        </section>

        <section className="px-[21px] pb-[25px] pt-[24px] text-center">
          <div className="flex items-center gap-[10px] rounded-[10px] border border-[#ffb3b3] bg-[#fff0f0] px-[16px] py-[14px] text-left">
            <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#ff474b]" />
            <p className="text-[14px] font-extrabold leading-[1.35] text-[#e60000]">
              Este programa es solo para personas menores de 50 años.
            </p>
          </div>

          <h2 className="mt-[22px] font-['Poppins',sans-serif] text-[20px] font-extrabold leading-[1.2] text-black">
            ¡Gracias por tu interés!
          </h2>
          <p className="mx-auto mt-[8px] max-w-[405px] text-[15px] leading-[1.55] text-[#374151]">
            El programa de <strong className="font-extrabold text-black">seguro de vida tipo IUL</strong> que ofrecemos está diseñado exclusivamente para personas de <strong className="font-extrabold text-black">18 a 50 años</strong>.
          </p>

          <div className="mt-[21px] border-t border-[#e5e7eb]" />

          <h3 className="mt-[19px] text-left text-[12px] font-extrabold uppercase leading-none tracking-[0.12em] text-[#9aa0a8]">
            ¿POR QUÉ NO CALIFICO?
          </h3>

          <div className="mt-[13px] grid gap-[10px]">
            {[
              ["🗓️", "bg-[#ffecef]", "Rango de edad del programa", "Solo aplica para personas de 18 a 50 años."],
              ["🛡️", "bg-[#eafbf0]", "Seguro de vida — etapa activa", "Diseñado para personas menores de 50 años de edad."],
              ["👨‍👩‍👧", "bg-[#f0edff]", "¿Tienes un familiar menor de 50?", "Puedes referirlos y ayudarlos a obtener cobertura."],
            ].map(([icon, iconBg, title, text]) => (
              <div key={title} className="flex items-center gap-[16px] rounded-[12px] border border-[#dfe3e8] bg-[#f6f7f9] px-[16px] py-[16px] text-left shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                <div className={`flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-[11px] ${iconBg} text-[20px]`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[15px] font-extrabold leading-[1.25] text-black">{title}</div>
                  <p className="mt-[3px] text-[13px] leading-[1.35] text-[#4b5563]">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-[27px] text-center text-[12px] font-extrabold uppercase leading-none tracking-[0.12em] text-[#9aa0a8]">
            ¿CONOCES A ALGUIEN QUE CALIFIQUE?
          </h3>
          <button
            type="button"
            onClick={onRefer}
            className="mt-[13px] inline-flex h-[55px] w-full items-center justify-center rounded-[11px] bg-[#31aeea] px-5 font-['Poppins',sans-serif] text-[16px] font-extrabold leading-none text-white transition hover:bg-[#259fdc]"
          >
            Referir a un familiar o amigo →
          </button>
          <div className="mt-[15px] text-[12px] text-[#9aa0a8]">🔒 Información segura y confidencial</div>
        </section>
      </div>
    </div>
  );
}

function SuccessPage() {
  return (
    <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
      <section className="border-b-[3px] border-[#10b981] px-5 pb-[18px] pt-5 text-center">
        <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#10b981,#059669)] shadow-[0_8px_24px_rgba(16,185,129,0.3)]">
          <svg viewBox="0 0 52 52" className="h-10 w-10" fill="none">
            <polyline points="14 27 22 35 38 19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-[1.4em] font-bold leading-[1.3] text-[#1f2937]">
          ¡Felicidades! Tu Solicitud Fue <span className="text-[#10b981]">Recibida Exitosamente</span>
        </h1>
        <p className="mt-3 text-[0.92em] leading-[1.5] text-[#6b7280]">
          Estás a un paso de la estrategia financiera que usan los millonarios
        </p>
      </section>

      <section className="relative bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-5 pb-[22px] pt-6 text-center text-white">
        <div className="absolute left-1/2 top-[-22px] -translate-x-1/2 text-[45px] animate-[bounceBadge_1s_ease-in-out_infinite]">
          🚨
        </div>
        <h2 className="text-[1.35em] font-bold">📞 Te Llamaremos Pronto</h2>
        <div className="mt-3 inline-block rounded-full border-2 border-white/40 bg-white/25 px-4 py-2 text-[1.05em] font-bold">
          ⏰ Próximas 2 Horas Hábiles
        </div>
        <p className="mt-3 text-[0.96em] leading-[1.6]">
          Un asesor certificado te contactará para tu consulta personalizada de 30-45 minutos
        </p>
      </section>

      <section className="border-y-4 border-[#f59e0b] bg-[#fef3c7] px-5 pb-[18px] pt-5">
        <div className="inline-block rounded-full bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-4 py-2 text-[0.85em] font-bold text-white animate-[pulseLite_2s_ease-in-out_infinite]">
          ⚡ MIRA ESTO AHORA - 3 MINUTOS
        </div>
        <h3 className="mt-3 text-[1.15em] font-bold leading-[1.3] text-[#78350f]">
          Edúcate Mientras Esperas La Llamada
        </h3>
        <p className="mt-2 text-[0.86em] leading-[1.4] text-[#92400e]">
          Descubre cómo proteger a tu familia MIENTRAS construyes riqueza libre de impuestos
        </p>
        <div className="mt-4 overflow-hidden rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
          <div className="relative pb-[56.25%]">
            <iframe src="https://fast.wistia.net/embed/iframe/70xicsvine" title="Video informativo" allow="autoplay; fullscreen" className="absolute inset-0 h-full w-full border-0" />
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[8px] border-l-[3px] border-[#10b981] bg-white px-3 py-3">
            <strong className="block text-[0.95em] text-[#1f2937]">✓ Acceso Sin Penalidades</strong>
            <span className="text-[0.9em] text-[#6b7280]">Usa tu dinero cuando quieras</span>
          </div>
          <div className="rounded-[8px] border-l-[3px] border-[#10b981] bg-white px-3 py-3">
            <strong className="block text-[0.95em] text-[#1f2937]">✓ Estrategia de los Ricos</strong>
            <span className="text-[0.9em] text-[#6b7280]">El secreto que el 95% desconoce</span>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-5">
        <h3 className="text-[1.1em] font-bold text-[#1f2937]">📋 Cómo Será La Llamada</h3>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[10px] border-l-[3px] border-[#3b82f6] bg-[#f9fafb] px-3 py-3">
            <strong className="block text-[0.9em] text-[#1f2937]">⚡ Número Puede Variar</strong>
            <p className="mt-1 text-[0.82em] leading-[1.5] text-[#6b7280]">
              Trabajamos con asesores certificados en todo el país. El código de área puede cambiar según tu especialista asignado.
            </p>
          </div>
          <div className="rounded-[10px] border-l-[3px] border-[#3b82f6] bg-[#f9fafb] px-3 py-3">
            <strong className="block text-[0.9em] text-[#1f2937]">⚡ Identificación Completa</strong>
            <p className="mt-1 text-[0.82em] leading-[1.5] text-[#6b7280]">
              Nuestro asesor se presentará con nombre completo y confirmará tu solicitud de hace unos minutos.
            </p>
          </div>
          <div className="rounded-[10px] border-l-[3px] border-[#3b82f6] bg-[#f9fafb] px-3 py-3">
            <strong className="block text-[0.9em] text-[#1f2937]">⚡ Ambiente Tranquilo</strong>
            <p className="mt-1 text-[0.82em] leading-[1.5] text-[#6b7280]">Busca un lugar privado. La consulta toma 30-45 minutos.</p>
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-[#3b82f6] bg-[#f0f9ff] px-5 py-5">
        <h3 className="text-[1.1em] font-bold text-[#1e40af]">✅ Ten Esta Info Lista</h3>
        <ul className="mt-4 grid gap-3">
          {[
            ["Datos Personales", "Fecha de nacimiento, estado civil, ocupación"],
            ["Salud General", "Altura, peso, medicamentos, historial básico"],
            ["Ingresos & Objetivos", "Ingresos anuales, metas a 10-20 años"],
            ["Protección Deseada", "¿Cuánto necesita tu familia? (10-15x tu ingreso)"],
            ["Beneficiarios", "Nombres de quienes deseas proteger"],
          ].map(([title, text]) => (
            <li key={title} className="flex items-start gap-3 rounded-[8px] bg-white px-3 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="mt-[1px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[1.05em] font-bold text-[#10b981]">✓</span>
              <div>
                <strong className="block text-[0.95em] text-[#1f2937]">{title}</strong>
                <span className="text-[0.88em] text-[#6b7280]">{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t-2 border-[#e5e7eb] bg-white px-5 py-4 text-center">
        <h4 className="text-[0.95em] font-bold text-[#1f2937]">🔒 Tu Información Está Protegida</h4>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[0.8em] font-semibold text-[#059669]">
          <span>✓ Asesores Certificados</span>
          <span>✓ Confidencial</span>
          <span>✓ Sin Compromiso</span>
        </div>
      </section>

      <section className="bg-[#f9fafb] px-5 py-5">
        <h3 className="text-[1.1em] font-bold text-[#1f2937]">❓ Preguntas Rápidas</h3>
        <div className="mt-4 grid gap-3">
          {[
            ["¿Si no contesto la llamada?", "Intentaremos 2-3 veces en diferentes horarios."],
            ["¿Hay algún costo?", "No. La consulta es 100% gratuita y sin compromiso."],
            ["¿Necesito mucho dinero?", "No. Trabajamos desde $100 hasta $5,000+ mensuales."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[8px] border-l-[3px] border-[#8b5cf6] bg-white px-3 py-3">
              <strong className="block text-[0.88em] text-[#1f2937]">{title}</strong>
              <p className="mt-1 text-[0.82em] leading-[1.5] text-[#6b7280]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-t-4 border-[#fbbf24] bg-[linear-gradient(135deg,#1e293b,#0f172a)] px-5 pb-7 pt-10 text-center text-white">
        <div className="absolute left-1/2 top-[-30px] flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-white text-[50px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]">📱</div>
        <p className="text-[1.05em] leading-[1.7] text-[#e5e7eb]">
          Mantén tu teléfono cerca y con <strong className="inline-block rounded-[6px] bg-[rgba(251,191,36,0.1)] px-3 py-1 text-[1.15em] uppercase tracking-[0.5px] text-[#fbbf24]">sonido activado</strong>
        </p>
        <p className="mt-3 text-[0.9em] italic text-white/85">
          Si ves una llamada entrante en las próximas 2 horas, probablemente somos nosotros
        </p>
      </section>
    </div>
  );
}

export default function QuotifyUs2PageClient() {
  const pathname = usePathname();
  const [step, setStep] = useState<Step>("age");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [locationStatus, setLocationStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [zipError, setZipError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const zipLookupRef = useRef<number | null>(null);
  const page = pathname || "/quotify-us2";
  const progress = progressMap[step];
  const displayName = answers.firstName.trim() || "amigo";
  const selectedState = answers.state || answers.detectedState;
  const detectedCity = extractCity(answers.locationText || answers.userCityState);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { answers?: Partial<Answers>; step?: Step };
      if (parsed.answers) setAnswers((prev) => ({ ...prev, ...parsed.answers }));
      if (parsed.step && parsed.step !== "success" && steps.includes(parsed.step)) setStep(parsed.step);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ step, answers }));
    } catch {}
  }, [answers, step]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const queryParams: Record<string, string> = {};
    const queryParamsAll: Record<string, string[]> = {};
    search.forEach((value, key) => { queryParams[key] = value; });
    Array.from(new Set(search.keys())).forEach((key) => { queryParamsAll[key] = search.getAll(key); });
    setAnswers((prev) => ({ ...prev, queryParams, queryParamsAll, sub4: prev.sub4 || queryParams.sub4 || "", sub11: prev.sub11 || queryParams.sub11 || "" }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLocation() {
      try {
        const response = await fetch("/api/location", { cache: "no-store" });
        if (!response.ok) throw new Error("location_failed");
        const data = (await response.json()) as LocationResponse;
        if (cancelled) return;
        setAnswers((prev) => ({ ...prev, detectedState: prev.detectedState || data.state || "", state: prev.state || data.state || "", zipCode: prev.zipCode || (data.zipCode ?? ""), locationText: prev.locationText || data.location || "", userCityState: prev.userCityState || data.location || "" }));
        setLocationStatus(data.location ? "ready" : "fallback");
      } catch {
        if (!cancelled) setLocationStatus("fallback");
      }
    }
    void loadLocation();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (step === "success") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (zipLookupRef.current !== null) window.clearTimeout(zipLookupRef.current);
    if (answers.zipCode.length !== 5) return;
    zipLookupRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/zip/${answers.zipCode}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as LocationResponse;
        setAnswers((prev) => ({ ...prev, state: data.state || prev.state || prev.detectedState, locationText: data.location || prev.locationText, userCityState: data.location || prev.userCityState }));
      } catch {}
    }, 220);
    return () => { if (zipLookupRef.current !== null) window.clearTimeout(zipLookupRef.current); };
  }, [answers.zipCode]);

  async function submit() {
    if (!validEmail(answers.email)) {
      setEmailError("Por favor ingresa un correo válido");
      return;
    }
    setEmailError("");
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const { resolvedZipCode, resolvedLocationText, resolvedState, resolvedDetectedState } = await resolveLocationSnapshot(answers);
      const normalizedPhone = normalizePhone(answers.phoneNumber);
      const cleanedAnswers = Object.fromEntries(
        Object.entries({
          ageGroup: answers.ageGroup,
          insuranceGoal: answers.insuranceGoal,
          state: resolvedState || resolvedDetectedState,
          firstName: answers.firstName.trim(),
          lastName: answers.lastName.trim(),
          phoneNumber: normalizedPhone,
          email: answers.email.trim(),
          locationText: resolvedLocationText,
          zipCode: resolvedZipCode,
        }).filter(([, value]) => value !== "" && value != null),
      );
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          answers: cleanedAnswers,
          meta: {
            deviceId: getOrCreateDeviceId(),
          },
        }),
      });
      const result = (await response.json().catch(() => null)) as LeadSubmitResponse | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "No pudimos enviar tu solicitud.");
      }

      const submittedLead: SubmittedLead = {
        ageGroup: answers.ageGroup,
        insuranceGoal: answers.insuranceGoal,
        firstName: answers.firstName.trim(),
        lastName: answers.lastName.trim(),
        fullName: `${answers.firstName.trim()} ${answers.lastName.trim()}`.trim(),
        phone: normalizedPhone,
        phoneNumber: normalizedPhone,
        email: answers.email.trim(),
        state: resolvedState || resolvedDetectedState,
        detectedState: resolvedDetectedState,
        detectedZipCode: resolvedZipCode,
        zipCode: resolvedZipCode,
        city: extractCity(resolvedLocationText || answers.userCityState),
        locationText: resolvedLocationText,
        userCityState: answers.userCityState || resolvedLocationText,
        sub4: answers.sub4,
        sub11: answers.sub11,
        consent: answers.consent,
        queryParams: answers.queryParams,
        queryParamsAll: answers.queryParamsAll,
      };
      const leadGeneratedEvent = await buildLeadGeneratedEvent(page, submittedLead);
      pushToDataLayer(leadGeneratedEvent);

      window.localStorage.setItem(
        "quotify-us2-last-draft",
        JSON.stringify({
          page,
          answers: {
            ...cleanedAnswers,
            detectedState: resolvedDetectedState,
            userCityState: answers.userCityState || resolvedLocationText,
            sub4: answers.sub4,
            sub11: answers.sub11,
            queryParams: answers.queryParams,
            queryParamsAll: answers.queryParamsAll,
          },
          meta: {
            deviceId: getOrCreateDeviceId(),
            funnel: "quotify-us2",
            preparedForWebhook: true,
          },
          lead: submittedLead,
          capturedAt: new Date().toISOString(),
        }),
      );
      setStep("success");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No pudimos enviar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonClass = "inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-[999px] bg-[#0b73ff] px-6 text-[18px] font-semibold text-white transition hover:bg-[#0968e6]";

  return (
    <main className="min-h-[100dvh] bg-white px-0 py-0 text-[#111827]" style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&family=Poppins:wght@500;600;700;800&display=swap");
        @keyframes pulseLite { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes bounceBadge { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-8px); } }
      `}</style>

      <div
        id={formId}
        data-form-id={formId}
        data-form-name={formName}
        className={`mx-auto flex w-full flex-col gap-0 ${step === "disqualified" ? "max-w-[482px]" : "max-w-[431px]"}`}
      >
        {step === "success" ? (
          <SuccessPage />
        ) : step === "disqualified" ? (
          <DisqualifiedPage
            onRefer={() => {
              setAnswers((prev) => ({ ...prev, ageGroup: "" }));
              setStep("age");
            }}
          />
        ) : (
          <section className="min-h-[100dvh] bg-white px-[3px] py-5">
            {step === "age" && (
              <>
                <div className="px-[10px]">
                  <div className="mt-[6px] text-center">
                    <h1 className="mx-auto max-w-[390px] font-['Poppins',sans-serif] text-[28px] font-bold leading-[1.28] tracking-[-0.02em] text-black">
                      🛡️ ¡Tu Familia Merece Protección HOY!
                    </h1>
                    <p className="mx-auto mt-[34px] max-w-[392px] font-['Poppins',sans-serif] text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-black">
                      ✅ Sin examen médico • ✅ Sin costos ocultos • ✅ Aprobación en 60 segundos
                    </p>
                  </div>
                  <div className="mt-[47px] text-center">
                    <h2 className="font-['Poppins',sans-serif] text-[21px] font-extrabold leading-[1.18] tracking-[-0.035em] text-black">
                      Primero dime: ¿Cuántos años tienes?
                    </h2>
                  </div>
                  <div className="mt-[31px] grid gap-[12px]">
                    {ageOptions.map((option) => (
                      <ChoiceButton
                        key={option}
                        label={option}
                        selected={answers.ageGroup === option}
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, ageGroup: option }));
                          window.setTimeout(() => setStep(option === "65 +" ? "disqualified" : "goal"), 120);
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-[12px] border-t border-[#e5e7eb]" />
                </div>
              </>
            )}

            {step !== "age" && step !== "location" && step !== "name" && step !== "phone" && step !== "email" && progress && (
              <>
                <div className="mt-1"><Progress {...progress} /></div>
              </>
            )}

            {step === "goal" && (
              <>
                <div className="mt-5 text-center">
                  <h2 className="font-['Poppins',sans-serif] text-[2.08rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[#111827]">¡Perfecto! Casi tienes tu cotización.</h2>
                  <h3 className="mx-auto mt-6 max-w-[398px] font-['Poppins',sans-serif] text-[1.24rem] font-semibold leading-[1.25] tracking-[-0.015em] text-black">Personaliza tu cobertura ideal.</h3>
                </div>
                {progress && (
                  <div className="mt-9">
                    <Progress {...progress} />
                  </div>
                )}
                <div className="mt-5 text-center">
                  <h2 className="font-['Poppins',sans-serif] text-[2.18rem] font-bold leading-[1.03] tracking-[-0.048em] text-[#111827]">¿Cuál es tu principal objetivo financiero?</h2>
                </div>
                <div className="mt-6 grid gap-3">
                  {goalOptions.map((option) => (
                    <ChoiceButton key={option} label={option} selected={answers.insuranceGoal === option} onClick={() => { setAnswers((prev) => ({ ...prev, insuranceGoal: option })); window.setTimeout(() => setStep("location"), 120); }} />
                  ))}
                </div>
              </>
            )}

            {step === "location" && (
              <>
                <div className="px-[6px]">
                  <div className="mt-1 text-center">
                    <h2 className="relative left-1/2 w-[calc(100vw-6px)] max-w-none -translate-x-1/2 font-['Poppins',sans-serif] text-[1.46rem] font-extrabold leading-none tracking-[-0.066em] text-[#111827] whitespace-nowrap">PROTEGE LO QUE MÁS IMPORTA.</h2>
                    <h2 className="mx-auto mt-4 max-w-[318px] font-['Poppins',sans-serif] text-[1.58rem] font-bold leading-[1.18] tracking-[-0.032em] text-[#111827]">Cotiza en menos de 60 segundos.</h2>
                  </div>
                  {progress && (
                    <div className="mt-5">
                      <Progress {...progress} />
                    </div>
                  )}
                  <div className="mx-[2px] mt-5 border-t border-[#e5e7eb]" />
                  <div className="mt-5 text-center">
                    <h2 className="font-['Poppins',sans-serif] text-[1.62rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#111827]">Selecciona tu estado:</h2>
                  </div>
                  <div className={`mt-4 rounded-[14px] border-[2px] px-4 py-[18px] text-center ${locationStatus === "loading" ? "border-[#2196f3] bg-[#e3f2fd]" : answers.locationText ? "border-[#2991f4] bg-[#d8ebff]" : "border-[#f5d68f] bg-[#fff7e1]"}`}>
                    {locationStatus === "loading" ? (
                      <>
                        <div className="text-[16px] text-[#1976d2]">🔍 Detectando tu ubicación...</div>
                        <div className="mt-2 text-[12px] text-[#666]">Esto toma solo unos segundos</div>
                      </>
                    ) : answers.locationText ? (
                      <>
                        <div className="flex items-center justify-center gap-[10px] text-[#2168bf]">
                          <span className="text-[22px] leading-none">🏠</span>
                          <span className="font-['Poppins',sans-serif] text-[1.18rem] font-semibold tracking-[-0.02em]">{formatDetectedRegion(answers.locationText, selectedState || answers.detectedState, detectedCity)}</span>
                        </div>
                        <div className="mt-[7px]">
                          <span className="inline-flex rounded-full bg-[#41b349] px-[9px] py-[3px] text-[9.5px] font-bold leading-none text-white">Detectado</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[15px] font-semibold text-[#9b6b00]">No pudimos detectar tu estado</div>
                        <div className="mt-2 text-[13px] text-[#765628]">Selecciona tu estado manualmente para continuar.</div>
                      </>
                    )}
                  </div>
                  <div className="mt-8">
                    <select value={selectedState} onChange={(e) => setAnswers((prev) => ({ ...prev, state: e.target.value }))} className="h-[46px] w-full rounded-[8px] border border-[#e6eaf0] bg-white px-[14px] text-[15px] text-[#111827] outline-none transition focus:border-[#1967d2]">
                      <option value="">Cambiar estado...</option>
                      {stateOptions.map((stateOption) => <option key={stateOption} value={stateOption}>{stateOption}</option>)}
                    </select>
                  </div>
                  <p className="mt-3 min-h-[20px] text-center text-[13px] text-[#d92d20]">{zipError}</p>
                  <button type="button" onClick={() => { if (!selectedState) return setZipError("Selecciona tu estado para continuar."); setZipError(""); setAnswers((prev) => ({ ...prev, state: prev.state || prev.detectedState, userCityState: prev.locationText || prev.userCityState })); setStep("name"); }} className="mt-[2px] inline-flex h-[56px] w-full items-center justify-center gap-[10px] rounded-[8px] bg-[#3a9be7] px-6 text-[17px] font-bold text-white transition hover:bg-[#3493dd]">
                    <span>✅</span>
                    <span className="font-extrabold tracking-[-0.02em]">Confirmar ubicación</span>
                    <svg viewBox="0 0 256 256" className="h-[17px] w-[17px]" fill="none">
                      <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="144 56 216 128 144 200" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {step === "name" && (
              <>
                <div className="px-[4px]">
                  <div className="mt-1 text-center">
                    <h2 className="relative left-1/2 w-[calc(100vw-8px)] max-w-none -translate-x-1/2 font-['Poppins',sans-serif] text-[1.9rem] font-[500] leading-none tracking-[-0.09em] text-[#111827] whitespace-nowrap">PROTEGE LO QUE MÁS AMAS.</h2>
                  </div>
                  {progress && (
                    <div className="mt-5">
                      <Progress {...progress} />
                    </div>
                  )}
                  <div className="mx-[2px] mt-5 border-t border-[#e5e7eb]" />
                  <div className="mt-5 text-center">
                    <h2 className="font-['Poppins',sans-serif] text-[1.26rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#111827] whitespace-nowrap">¿Cuál es tu nombre completo?</h2>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-[10px]">
                    <input value={answers.firstName} onChange={(e) => setAnswers((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="Nombre" className="h-[72px] w-full rounded-[6px] border border-[#E9EAEC] bg-[#E9EAEC] px-[16px] pt-[14px] text-[18px] text-[#111827] outline-none transition placeholder:text-[#bfc4cb] focus:border-[#2f47ff] focus:bg-white" />
                    <input value={answers.lastName} onChange={(e) => setAnswers((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Apellido" className="h-[72px] w-full rounded-[6px] border border-[#E9EAEC] bg-[#E9EAEC] px-[16px] pt-[14px] text-[18px] text-[#111827] outline-none transition placeholder:text-[#bfc4cb] focus:border-[#2f47ff] focus:bg-white" />
                  </div>
                  <button type="button" onClick={() => { if (!answers.firstName.trim() || !answers.lastName.trim()) return; setStep("phone"); }} className="mt-5 inline-flex h-[56px] w-full items-center justify-center gap-[12px] rounded-[8px] bg-[#3a9be7] px-6 text-[19px] font-bold text-white transition hover:bg-[#3493dd]">
                    <span className="font-extrabold tracking-[-0.02em]">Seguir</span>
                    <svg viewBox="0 0 256 256" className="h-[18px] w-[18px]" fill="none">
                      <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="144 56 216 128 144 200" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="mt-9 space-y-4 text-center text-[17px] leading-[1.45] text-[#111827]">
                    <p>🔒 Tu información está cifrada y nunca será compartida con terceros.</p>
                    <p>⚠️ Un agente está disponible por poco tiempo. Reserva tu cupo ahora.</p>
                  </div>
                  <InlineTrustLogos />
                </div>
              </>
            )}

            {step === "phone" && (
              <>
                <div className="px-[6px]">
                  <div className="mt-4 text-center">
                    <h3 className="text-[1.32rem] font-bold leading-[1.18] tracking-[-0.03em] text-[#111827]">🔒 Tu cotización está casi lista.</h3>
                    <h3 className="mt-1 text-[1.32rem] font-bold leading-[1.18] tracking-[-0.03em] text-[#111827]">📞 Un agente disponible puede ayudarte ahora mismo.</h3>
                  </div>
                  {progress && (
                    <div className="mt-4">
                      <Progress {...progress} />
                    </div>
                  )}
                  <div className="mx-[2px] mt-5 border-t border-[#e5e7eb]" />
                  <div className="mt-5 text-center">
                    <h2 className="mx-auto max-w-[392px] font-['Poppins',sans-serif] text-[1.72rem] font-bold leading-[1.16] tracking-[-0.04em] text-[#111827]">¿{displayName} a qué número te enviamos tu cotización personalizada?</h2>
                  </div>
                  <div className={`mt-6 overflow-hidden rounded-[8px] border ${phoneError ? "border-[#ef4444]" : "border-[#dbe2ea]"}`}>
                    <div className="flex h-[54px] items-center bg-[#E9EAEC]">
                      <div className={`flex h-full min-w-[76px] items-center gap-2 border-r px-3 text-[15px] font-semibold uppercase ${phoneError ? "border-[#ef4444] bg-[#E9EAEC] text-[#555]" : "border-[#dbe2ea] bg-[#E9EAEC] text-[#555]"}`}>
                        <span>us</span>
                        <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none">
                          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="flex min-w-0 flex-1 items-center bg-[#E9EAEC] px-4">
                        <span className="mr-2 text-[17px] text-[#c6c9cf]">+1</span>
                        <input value={formatPhone(answers.phoneNumber)} onChange={(e) => { setAnswers((prev) => ({ ...prev, phoneNumber: e.target.value })); if (phoneError) setPhoneError(""); }} inputMode="tel" autoComplete="tel" placeholder="000 000 0000" className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-[#111827] outline-none placeholder:text-[#c6c9cf]" />
                      </div>
                    </div>
                    {phoneError ? (
                      <div className="flex items-center gap-2 border-t border-[#f5b5b5] px-3 py-[10px] text-[13px] text-[#e11d48]">
                        <span className="text-[16px] leading-none">✕</span>
                        <span>Por favor, ingresa un número de teléfono válido.</span>
                      </div>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => { const msg = phoneErrorMessage(answers.phoneNumber); if (msg) return setPhoneError(msg); setPhoneError(""); setStep("email"); }} className="mt-10 inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-[8px] bg-[#3a9be7] px-6 text-[17px] font-bold text-white transition hover:bg-[#3493dd]">
                    <span className="font-extrabold tracking-[-0.02em]">Ver mi cotización ahora</span>
                    <svg viewBox="0 0 256 256" className="h-[18px] w-[18px]" fill="none">
                      <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="144 56 216 128 144 200" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <InlineTrustLogos />
                </div>
              </>
            )}

            {step === "email" && (
              <>
                <div className="px-[4px]">
                  <div className="mt-5 text-center">
                    <h2 className="font-['Poppins',sans-serif] text-[1.8rem] font-bold leading-[1.15] text-[#111827]">PROTEGE LO QUE MÁS AMAS.</h2>
                    <h4 className="mt-2 text-[1.05rem] leading-[1.45] text-[#374151]">Podría ahorrar un 70% en un seguro de vida.</h4>
                  </div>
                  {progress && (
                    <div className="mt-5">
                      <Progress {...progress} />
                    </div>
                  )}
                  <div className="mt-5 border-t border-[#e5e7eb]" />
                  <div className="mt-5 text-center">
                    <h2 className="font-['Poppins',sans-serif] text-[1.72rem] font-bold leading-[1.16] tracking-[-0.038em] text-[#111827]">
                      <span className="mr-2 inline-flex align-[0.02em] text-[#d89bcc]">
                        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 7h16v10H4z" fill="currentColor" opacity="0.18" />
                          <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.6" />
                          <path d="m4.5 8 7.5 5.5L19.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 3.5v6.2" stroke="#ef2f6f" strokeWidth="2" strokeLinecap="round" />
                          <path d="m9.8 7.2 2.2 2.2 2.2-2.2" stroke="#ef2f6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      ¿{displayName} cuál es tu correo para enviarte la cotización?
                    </h2>
                  </div>
                  <div className="mt-6 rounded-[8px] border border-[#E9EAEC] bg-[#E9EAEC] transition focus-within:border-[#2f47ff] focus-within:bg-white">
                    <div className="flex items-center gap-3 px-3">
                      <span className="text-[#6b7280]">
                        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.8" />
                          <path d="m4.5 8 7.5 5.5L19.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <input value={answers.email} onChange={(e) => setAnswers((prev) => ({ ...prev, email: e.target.value }))} inputMode="email" autoComplete="email" placeholder="Ej: correo@ejemplo.com" className="h-[56px] min-w-0 flex-1 bg-transparent text-[16px] text-[#111827] outline-none placeholder:text-[#c6c9cf]" />
                    </div>
                  </div>
                  <div className="mt-4 text-center text-[14px] leading-[1.55] text-[#4b5563]">🔐 Tu información está segura. Solo la usamos para enviarte tu cotización.</div>
                  <p className="mt-3 min-h-[20px] text-center text-[13px] text-[#d92d20]">{emailError || submitError}</p>
                  <button type="button" onClick={() => void submit()} disabled={isSubmitting} className="mt-4 inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-[8px] bg-[#0b73ff] px-6 text-[17px] font-bold text-white transition hover:bg-[#0968e6] disabled:cursor-wait disabled:opacity-75">
                  {isSubmitting ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <span className="font-extrabold tracking-[-0.02em]">Ver mi cotización personalizada</span>
                      <svg viewBox="0 0 256 256" className="h-[18px] w-[18px]" fill="none">
                        <path d="M219.53563,121.02,50.62075,26.42762A8,8,0,0,0,39.178,36.09836l31.86106,89.211a8,8,0,0,1,0,5.38138L39.178,219.90164a8,8,0,0,0,11.44277,9.67074l168.91488-94.59233A8,8,0,0,0,219.53563,121.02Z" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="72" y1="128" x2="136" y2="128" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
                  <div className="mt-5 text-center text-[15px] font-semibold text-[#6b4eff]">⏳ Oferta válida por tiempo limitado.</div>
                  <InlineTrustLogos />
                </div>
              </>
            )}
          </section>
        )}
        <FooterLegal />
      </div>
    </main>
  );
}
