"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const trustBadges = [
  { icon: "/best-money-assets/tax-free.svg", text: "Retiro libre de impuestos" },
  { icon: "/best-money-assets/family-protection.svg", text: "Protege a tu familia" },
  { icon: "/best-money-assets/minutes.svg", text: "Toma menos de 2 minutos" },
];

const redirectTargetUrl = "https://www.estrategiafinancierausa.com/";

const introBenefits = [
  {
    icon: "📈",
    title: "Ahorro con Interés Compuesto",
    description: "Maximiza tus fondos con rendimientos de hasta el 9.5% anual.",
  },
  {
    icon: "🚫",
    title: "Retiros Libres de Impuestos",
    description: "Accede a tu dinero para el retiro sin pagar impuestos al IRS.",
  },
  {
    icon: "🏦",
    title: "Liquidez Inmediata",
    description: "Solicita préstamos usando tu póliza como garantía cuando quieras.",
  },
  {
    icon: "🛡️",
    title: "Protección Contra Caídas",
    description: "Tu ahorro está seguro (Piso 0%) aunque el mercado caiga.",
  },
  {
    icon: "🏥",
    title: "Beneficios en Vida",
    description: "Usa tus fondos en caso de una enfermedad crítica o emergencia grave.",
  },
];

const howItWorksSteps = [
  { number: "1", title: "Te hacemos unas preguntas", description: "para verificar si calificas." },
  { number: "2", title: "Revisamos tu perfil", description: "y estimamos tu beneficio IUL." },
  { number: "3", title: "Accede a tu plan", description: "y recibe tu beneficio." },
];

const metrics = [
  { value: "73,698", label: "Familias ayudadas en 2026" },
  { value: "100%", label: "Beneficio familiar protegido" },
  { value: "$200K+", label: "Potencial en valor acumulado" },
];

const footerLinks = [
  { label: "About Us", href: "https://www.bestmoney.com/" },
  { label: "Cookie Policy", href: "https://www.bestmoney.com/privacy-policy" },
  { label: "Terms Of Use", href: "https://www.bestmoney.com/terms-of-use" },
  { label: "Partner With Us", href: "https://www.bestmoney.com/" },
  { label: "Privacy Policy", href: "https://www.bestmoney.com/privacy-policy" },
  { label: "Contact", href: "https://www.bestmoney.com/" },
  { label: "Sitemap", href: "https://www.bestmoney.com/" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/BestMoneyCom", icon: "/best-money-assets/facebook.png" },
  { label: "Instagram", href: "https://www.instagram.com/", icon: "/best-money-assets/instagram.png" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/bestmoney-com/", icon: "/best-money-assets/linkedin.png" },
];

const ageOptions = ["25 a 34", "35 a 44", "45 a 54", "55 a 65", "65+"];
const goalOptions = [
  "Seguro de vida",
  "Ahorrar e invertir",
  "Planificación de retiro",
  "No estoy seguro aún",
];
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

type FunnelStep =
  | "intro"
  | "age"
  | "goal"
  | "state"
  | "name"
  | "phone"
  | "email"
  | "success";

type FunnelAnswers = {
  zipCode: string;
  locationText: string;
  ageGroup: string;
  insuranceGoal: string;
  state: string;
  firstName: string;
  lastName: string;
  phoneCountry: string;
  phoneNumber: string;
  email: string;
  detectedState: string;
};

const stepOrder: FunnelStep[] = [
  "intro",
  "age",
  "goal",
  "state",
  "name",
  "phone",
  "email",
  "success",
];

const progressByStep: Record<FunnelStep, number | null> = {
  intro: null,
  age: null,
  goal: 32,
  state: 52,
  name: 67,
  phone: 88,
  email: 97,
  success: 100,
};

const emptyAnswers: FunnelAnswers = {
  zipCode: "",
  locationText: "",
  ageGroup: "",
  insuranceGoal: "",
  state: "",
  firstName: "",
  lastName: "",
  phoneCountry: "US",
  phoneNumber: "",
  email: "",
  detectedState: "",
};

const thankYouHighlights = [
  {
    title: "Acceso Sin Penalidades",
    description: "Usa tu dinero cuando lo necesites, sin restricciones",
  },
  {
    title: "Estrategia de los Ricos",
    description: "El secreto financiero que el 95% de personas desconoce",
  },
];

const thankYouCallSteps = [
  {
    title: "El número puede ser desconocido",
    description:
      "Trabajamos con asesores en todo el país. El código de área puede variar. ¡Contéstala!",
    icon: "bolt",
  },
  {
    title: "Se presentará con nombre completo",
    description:
      "Tu asesor confirmará tu solicitud y se identificará. Es 100% profesional y gratuito.",
    icon: "user",
  },
  {
    title: "Busca un lugar tranquilo",
    description:
      "La llamada es rápida - solo 10 a 15 minutos para ver tu precio exacto.",
    icon: "focus",
  },
];

const thankYouInfoList = [
  {
    title: "Datos Personales",
    description: "Fecha de nacimiento, estado civil, ocupación",
  },
  {
    title: "Salud General",
    description: "Altura, peso, medicamentos, historial básico",
  },
  {
    title: "Ingresos & Objetivos",
    description: "Ingresos anuales, metas a 10-20 años",
  },
  {
    title: "Protección Deseada",
    description: "¿Cuánto necesita tu familia? (10-15x tu ingreso)",
  },
  {
    title: "Beneficiarios",
    description: "Nombres de quienes deseas proteger",
  },
];

const thankYouFaqs = [
  {
    title: "¿Si no contesto la llamada?",
    description:
      "Intentaremos contactarte 2-3 veces en diferentes horarios del día.",
  },
  {
    title: "¿Hay algún costo?",
    description:
      "No. La consulta es 100% gratuita y sin ningún compromiso de compra.",
  },
  {
    title: "¿Necesito mucho dinero?",
    description:
      "No. Tenemos planes desde $100 hasta $5,000+ mensuales, adaptados a tu presupuesto.",
  },
  {
    title: "¿Aplica para inmigrantes o residentes?",
    description:
      "Sí. Muchos planes están disponibles independientemente del estatus migratorio. Tu asesor te explicará las opciones.",
  },
];

const deviceStorageKey = "best-money-device-id";

function formatPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const chunks = [];
  if (digits.length > 0) chunks.push(digits.slice(0, 3));
  if (digits.length > 3) chunks.push(digits.slice(3, 6));
  if (digits.length > 6) chunks.push(digits.slice(6, 10));
  return chunks.join(" ");
}

function isValidPhone(value: string) {
  return getPhoneValidationMessage(value) === "";
}

function getPhoneValidationMessage(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 10) {
    return "Ingresa un número válido de EE.UU. con 10 dígitos.";
  }

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) {
    return "Ingresa un número real de EE.UU.";
  }

  if (
    digits === "0123456789" ||
    digits === "1234567890" ||
    digits === "9876543210" ||
    /^(\d)\1{9}$/.test(digits) ||
    /^(\d{2})\1{4}$/.test(digits) ||
    /^(\d{5})\1$/.test(digits) ||
    digits.split("").filter((digit) => digit === "0").length >= 7 ||
    digits.slice(0, 3) === "555" ||
    digits.slice(3, 6) === "555"
  ) {
    return "Ingresa un número real de EE.UU. Evita secuencias o números de ejemplo.";
  }

  return "";
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) return existing;

  const newId = `bm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(deviceStorageKey, newId);
  return newId;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function extractCityFromLocation(locationText: string) {
  const normalized = locationText.trim();
  if (!normalized) return "";
  if (normalized.toLowerCase() === "rates available for your area") return "";
  const [cityPart] = normalized.split(",");
  const city = cityPart?.trim() || "";
  if (!city) return "";
  if (/area|rates available/i.test(city)) return "";
  return city;
}

function optionButtonClass(isSelected: boolean) {
  return [
    "flex min-h-[62px] w-full items-center rounded-[16px] border bg-white px-5 text-left text-[17px] tracking-[-0.03em] text-[#101820] shadow-[0_4px_10px_rgba(16,24,32,0.08)] transition",
    isSelected ? "border-[var(--brand)] shadow-[0_0_0_1px_var(--brand)]" : "border-[#9c9c9c] hover:border-[#6f6f6f]",
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

function FinalArrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      className={className}
    >
      <path
        d="M219.53563,121.02,50.62075,26.42762A8,8,0,0,0,39.178,36.09836l31.86106,89.211a8,8,0,0,1,0,5.38138L39.178,219.90164a8,8,0,0,0,11.44277,9.67074l168.91488-94.59233A8,8,0,0,0,219.53563,121.02Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="24"
      />
      <line
        x1="72"
        y1="128"
        x2="136"
        y2="128"
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

function BellIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 4.5a4 4 0 0 1 4 4v2.1c0 .7.2 1.4.6 2l1.1 1.7c.5.8-.1 1.7-1 1.7H7.3c-.9 0-1.5-.9-1-1.7l1.1-1.7c.4-.6.6-1.3.6-2V8.5a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18a2.3 2.3 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
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

function UserIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />
      <path
        d="M5.5 18.5c1.6-2.7 4-4 6.5-4s4.9 1.3 6.5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FocusIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9.5" cy="10" r="1" fill="currentColor" />
      <circle cx="14.5" cy="10" r="1" fill="currentColor" />
      <path
        d="M8.8 14.2c.9.9 1.9 1.3 3.2 1.3 1.3 0 2.3-.4 3.2-1.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <rect x="6" y="4.5" width="12" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4.5h6v3H9z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function QuestionIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-.9.7-1.6 1.3-1.6 2.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

function IntroBenefitIcon({
  icon,
  className = "h-[26px] w-[26px]",
}: {
  icon: (typeof introBenefits)[number]["icon"];
  className?: string;
}) {
  if (icon === "growth") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="#ece7ff" />
        <path d="M6.5 16.5 10 13l2.4 2.2 5.1-5.2" stroke="#3b82f6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 7.5v9M11.5 7.5v9M16.5 7.5v9" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "tax") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
        <circle cx="12" cy="12" r="7.8" stroke="#ff4d67" strokeWidth="2.2" />
        <path d="M7 7 17 17" stroke="#ff4d67" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "liquidity") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
        <path d="M4 9.3 12 4l8 5.3" stroke="#8b7aa8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10h13" stroke="#8b7aa8" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M7.2 10v7.3M12 10v7.3M16.8 10v7.3" stroke="#8b7aa8" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4.5 18h15" stroke="#8b7aa8" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "protection") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
        <path d="M12 3.8c2.8 1.9 5.8 2.4 8 2.5v6c0 4.5-3.2 7.9-8 9.5-4.8-1.6-8-5-8-9.5v-6c2.2-.1 5.2-.6 8-2.5Z" fill="#5bb2ff" stroke="#4477e6" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" fill="#f2e8ff" />
      <path d="M12 7.2v5.4M9.3 9.9h5.4" stroke="#ff4db8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 15.8h7" stroke="#c084fc" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 18.2h5.2" stroke="#c084fc" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhonePadIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <rect x="4.5" y="2.5" width="15" height="19" rx="3" fill="#6b4eff" />
      <rect x="8" y="5.5" width="2.2" height="2.2" rx=".4" fill="#ff9b44" />
      <rect x="11" y="5.5" width="2.2" height="2.2" rx=".4" fill="#ffd84d" />
      <rect x="14" y="5.5" width="2.2" height="2.2" rx=".4" fill="#4dd7ff" />
      <rect x="8" y="9" width="2.2" height="2.2" rx=".4" fill="#ffd84d" />
      <rect x="11" y="9" width="2.2" height="2.2" rx=".4" fill="#4dd7ff" />
      <rect x="14" y="9" width="2.2" height="2.2" rx=".4" fill="#ff9b44" />
      <rect x="8" y="12.5" width="2.2" height="2.2" rx=".4" fill="#4dd7ff" />
      <rect x="11" y="12.5" width="2.2" height="2.2" rx=".4" fill="#ff9b44" />
      <rect x="14" y="12.5" width="2.2" height="2.2" rx=".4" fill="#ffd84d" />
    </svg>
  );
}

export default function Home() {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<FunnelStep>("intro");
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");
  const [panelKey, setPanelKey] = useState(0);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);
  const [answers, setAnswers] = useState<FunnelAnswers>(emptyAnswers);
  const [defaultLocationText, setDefaultLocationText] = useState(emptyAnswers.locationText);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [hasHydratedSavedData, setHasHydratedSavedData] = useState(false);
  const [hasLoadedGeo, setHasLoadedGeo] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadEventNonce, setLeadEventNonce] = useState<string | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const trackedLeadNonceRef = useRef<string | null>(null);

  const progress = progressByStep[currentStep];
  const isSuccessPage = currentStep === "success";
  const isQuestionnaire = currentStep !== "intro";
  const isHomePage = pathname === "/";
  const pageValue = isHomePage ? "home" : pathname;
  const storageKeyValue = useMemo(() => `best-money-funnel-v1:${pageValue}`, [pageValue]);
  const successHash = "#gracias";
  const selectedState = answers.state || answers.detectedState || "Florida";
  const animationClass = isTransitioningOut
    ? "animate-[survey-question-out_0.18s_cubic-bezier(0.4,0,1,1)_forwards]"
    : "animate-[survey-question-in_0.42s_cubic-bezier(0.22,0.61,0.36,1)]";

  const normalizedPhone = useMemo(() => answers.phoneNumber.replace(/\D/g, ""), [answers.phoneNumber]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKeyValue);
      if (!raw) {
        setHasHydratedSavedData(true);
        return;
      }

      const parsed = JSON.parse(raw) as { answers?: Partial<FunnelAnswers>; currentStep?: FunnelStep };

      if (parsed.answers) {
        setAnswers((prev) => ({ ...prev, ...parsed.answers }));
        if (parsed.answers.locationText) {
          setDefaultLocationText(parsed.answers.locationText);
        }
      }

      if (
        parsed.currentStep &&
        parsed.currentStep !== "success" &&
        stepOrder.includes(parsed.currentStep)
      ) {
        setCurrentStep(parsed.currentStep);
      }
    } catch {
      // Ignore invalid localStorage payloads.
    } finally {
      setHasHydratedSavedData(true);
    }
  }, [storageKeyValue]);

  useEffect(() => {
    if (!hasHydratedSavedData) return;
    const persistedStep = currentStep === "success" ? "intro" : currentStep;
    window.localStorage.setItem(
      storageKeyValue,
      JSON.stringify({ currentStep: persistedStep, answers }),
    );
  }, [answers, currentStep, hasHydratedSavedData, storageKeyValue]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateAreaFromIp() {
      try {
        const response = await fetch("/api/location", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          location?: string;
          zipCode?: string | null;
          state?: string | null;
        };

        if (isCancelled || !data.location) return;

        setDefaultLocationText((prev) => prev || data.location || emptyAnswers.locationText);
        setAnswers((prev) => ({
          ...prev,
          zipCode:
            isHomePage
              ? prev.zipCode
              : prev.zipCode && prev.zipCode.length === 5
                ? prev.zipCode
                : data.zipCode && /^\d{5}$/.test(data.zipCode)
                  ? data.zipCode
                  : prev.zipCode,
          locationText: prev.locationText || data.location || emptyAnswers.locationText,
          state: prev.state || data.state || prev.detectedState,
          detectedState: prev.detectedState || data.state || "",
        }));
      } catch {
        // Local fallback stays in place if geo isn't available.
      } finally {
        if (!isCancelled) setHasLoadedGeo(true);
      }
    }

    void hydrateAreaFromIp();

    return () => {
      isCancelled = true;
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!hasLoadedGeo) return;
    if (isHomePage) {
      setIsLookingUpZip(false);
      return;
    }

    const zipCode = answers.zipCode;

    if (zipCode.length === 0) {
      setAnswers((prev) => ({ ...prev, locationText: defaultLocationText }));
      setIsLookingUpZip(false);
      return;
    }

    if (zipCode.length < 5) {
      setAnswers((prev) => ({ ...prev, locationText: defaultLocationText }));
      setIsLookingUpZip(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLookingUpZip(true);

        const response = await fetch(`/api/zip/${zipCode}`, {
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

        const data = (await response.json()) as {
          location?: string | null;
          state?: string | null;
        };

        setAnswers((prev) => ({
          ...prev,
          locationText: data.location || defaultLocationText,
          state: data.state || prev.state || prev.detectedState,
        }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAnswers((prev) => ({
            ...prev,
            locationText: defaultLocationText,
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
  }, [answers.zipCode, defaultLocationText, hasLoadedGeo, isHomePage]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const guardSuccessHash = () => {
      if (window.location.hash !== successHash) return;
      if (currentStep === "success" || leadEventNonce) return;

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      setCurrentStep("intro");
      setPanelKey((prev) => prev + 1);
    };

    guardSuccessHash();
    window.addEventListener("hashchange", guardSuccessHash);
    return () => window.removeEventListener("hashchange", guardSuccessHash);
  }, [currentStep, leadEventNonce, successHash]);

  useEffect(() => {
    if (!leadEventNonce || currentStep !== "success" || window.location.hash !== successHash) return;
    if (trackedLeadNonceRef.current === leadEventNonce) return;

    const trackingWindow = window as Window &
      typeof globalThis & {
        fbq?: (...args: unknown[]) => void;
        ttq?: { track?: (...args: unknown[]) => void };
      };

    trackedLeadNonceRef.current = leadEventNonce;
    trackingWindow.fbq?.("track", "Lead");
    trackingWindow.ttq?.track?.("CompleteRegistration");
  }, [currentStep, leadEventNonce, successHash]);

  function transitionTo(nextStep: FunnelStep, direction: "forward" | "backward") {
    setSlideDirection(direction);
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
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex <= 0) return;
    transitionTo(stepOrder[currentIndex - 1], "backward");
  }

  function startQuestionnaire() {
    transitionTo("age", "forward");
  }

  function getRedirectHref() {
    const targetUrl = new URL(redirectTargetUrl);
    const incomingParams = new URLSearchParams(window.location.search);

    incomingParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    return targetUrl.toString();
  }

  function redirectToOffer(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    window.location.href = getRedirectHref();
  }

  function handleDirectChoice<K extends keyof FunnelAnswers>(
    field: K,
    value: FunnelAnswers[K],
    nextStep: FunnelStep
  ) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    window.setTimeout(() => {
      transitionTo(nextStep, "forward");
    }, 120);
  }

  async function submitLead() {
    if (!answers.firstName.trim() || !answers.lastName.trim()) return;

    const phoneValidationMessage = getPhoneValidationMessage(normalizedPhone);
    if (phoneValidationMessage) {
      setPhoneError(phoneValidationMessage);
      return;
    }

    if (!isValidEmail(answers.email)) {
      setEmailError("Por favor, ingresa un correo válido.");
      return;
    }

    setPhoneError("");
    setEmailError("");
    setSubmitError("");
    setIsSubmittingLead(true);

    try {
      const cleanedAnswers = Object.fromEntries(
        Object.entries({
          ageGroup: answers.ageGroup,
          insuranceGoal: answers.insuranceGoal,
          state: answers.state || answers.detectedState,
          firstName: answers.firstName.trim(),
          lastName: answers.lastName.trim(),
          phoneNumber: normalizedPhone,
          email: answers.email.trim(),
          locationText: answers.locationText,
          zipCode: isHomePage ? undefined : answers.zipCode,
        }).filter(([, value]) => value !== "" && value != null)
      );

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageValue,
          answers: cleanedAnswers,
          meta: {
            deviceId: getOrCreateDeviceId(),
          },
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error || "Lead submission failed");
      }

      const leadNonce = `${Date.now()}`;
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${successHash}`,
      );
      setLeadEventNonce(leadNonce);
      transitionTo("success", "forward");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "No pudimos enviar tu solicitud ahora mismo. Tus respuestas quedaron guardadas.";
      setSubmitError(message);
    } finally {
      setIsSubmittingLead(false);
    }
  }

  function renderProgress() {
    if (progress == null) {
      return <div className="h-[8px] w-full max-w-[300px]" />;
    }

    return (
      <div className="w-full max-w-[300px] rounded-full bg-[#d9d9d9]">
        <div
          className="h-[8px] rounded-full bg-[var(--brand)] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }

  function renderIntroPanel() {
    return (
      <div
        className="mx-auto flex w-full max-w-[980px] animate-[fade-up_0.55s_ease-out] flex-col items-center"
        style={{ fontFamily: '"Montserrat", "HurmeGeo", Arial, sans-serif' }}
      >
        <div className="w-full max-w-[800px] px-[10px] py-[10px]">
          <div className="text-center">
            <h1 className="mx-auto max-w-[330px] text-[31px] leading-[1.34] font-bold text-[#0d2b5b] md:max-w-none md:text-[52px] md:leading-[1.14]">
              Plan Estratégico de Ahorro IUL 2026
            </h1>
            <p className="mx-auto mt-4 max-w-[340px] border-b-2 border-[#f1f5f9] pb-[15px] text-[13px] leading-[1.2] text-[#64748b] md:max-w-none md:text-[18px]">
              Exclusivo para residentes de 22 a 45 años
            </p>
          </div>

          <div className="mt-[15px] grid gap-[15px]">
            {introBenefits.map((benefit) => (
              <a
                key={benefit.title}
                href={redirectTargetUrl}
                onClick={redirectToOffer}
                className="flex cursor-pointer items-stretch overflow-hidden rounded-[15px] bg-[#f8fafc] text-left shadow-[0_0_0_1px_#f0f4f8] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:scale-[1.02] hover:bg-white hover:shadow-[0_5px_15px_rgba(0,0,0,0.08)]"
              >
                <div className="w-[6px] shrink-0 bg-[#1a73e8]" />
                <div className="flex flex-1 items-center gap-[14px] px-[18px] py-[16px]">
                  <div className="flex min-w-[42px] justify-center text-[29px] leading-none">
                    <span aria-hidden="true">{benefit.icon}</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <h2 className="text-[18px] leading-[1.2] font-bold text-[#1e40af] md:text-[19px]">
                      {benefit.title}
                    </h2>
                    <p className="mt-1 text-[15px] leading-[1.4] text-[#475569] md:text-[16px]">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-[40px] flex justify-center">
            <a
              href={redirectTargetUrl}
              onClick={redirectToOffer}
              className="inline-flex w-full max-w-[500px] flex-col items-center justify-center rounded-[50px] bg-[#1a73e8] px-8 py-[22px] text-white shadow-[0_10px_20px_rgba(26,115,232,0.3)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(26,115,232,0.38)]"
            >
              <span className="text-[21px] leading-[1.15] font-extrabold text-white md:text-[24px]">
                Verificar Mi Elegibilidad
              </span>
              <span className="mt-1 block text-[13px] font-normal text-[#e0f2fe] md:text-[14px]">
                (Solo para personas de 22 a 45 años)
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  function renderSuccessPage() {
    return (
      <div className="mx-auto w-full max-w-[490px] overflow-hidden bg-white">
        <section className="border-t border-[#f2d7d7] px-4 pb-6 pt-5 text-center md:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#18bf79] text-white shadow-[0_10px_24px_rgba(24,191,121,0.25)]">
            <FilledCheckIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-[20px] leading-none font-black tracking-[-0.04em] text-[#13213c]">
            ¡Felicidades!
          </h2>
          <p className="mt-2 text-[19px] leading-[1.08] font-black tracking-[-0.04em] text-[#13213c]">
            Tu Solicitud Fue <span className="text-[#16c96f]">Recibida</span>{" "}
            <span className="inline-flex translate-y-[2px] text-[#64d98d]">
              <BadgeCheckIcon className="h-5 w-5" />
            </span>
          </p>
          <p className="mt-4 text-[14px] leading-[1.45] text-[#5e6781]">
            Un asesor certificado te llamará en los próximos{" "}
            <span className="font-black text-[#16c96f]">15 minutos.</span>
          </p>
        </section>

        <section className="border-t-[3px] border-[#20d47a] bg-[#ef3131] px-4 py-4 text-center md:px-6">
          <div className="flex items-center justify-center gap-2 text-[16px] font-black tracking-[-0.03em] text-[#151515]">
            <PhoneIcon className="h-4 w-4 text-[#9a52ff]" />
            <span>Prepárate - Te Llamamos Ahora</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 text-[12px] font-black tracking-[0.05em] text-white">
            <BellIcon className="h-5 w-5 text-[#ffdf59]" />
            <span>TU LLAMADA EN MENOS DE</span>
          </div>
          <div className="mt-3 rounded-[18px] border-2 border-[#ffb8b8] bg-[#f35f5f] px-4 py-3">
            <p className="text-[27px] leading-[0.95] font-black tracking-[0.03em] text-white md:text-[34px]">
              En cualquier
              <br />
              momento...
            </p>
          </div>
          <p className="mt-4 text-[14px] leading-[1.45] text-[#141414]">
            Mantén tu teléfono cerca con{" "}
            <span className="font-black">sonido activado.</span>
            <br />
            La llamada es rápida -{" "}
            <span className="font-black">10 a 15 minutos</span> para ver tu precio exacto.
          </p>
        </section>

        <section className="border-t-[3px] border-[#ffbe2e] bg-[#fff1b8] px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f94848] px-3 py-1 text-[12px] font-black tracking-[0.02em] text-white">
              <BoltIcon className="h-3 w-3" />
              MIRA ESTO AHORA
            </span>
            <h3 className="text-[17px] font-black tracking-[-0.03em] text-[#7b4a10]">
              Mira Esto Mientras Esperas
            </h3>
          </div>
          <p className="mt-3 text-[14px] leading-[1.4] text-[#7b4a10]">
              Descubre cómo proteger a tu familia MIENTRAS construyes riqueza libre
            de impuestos
          </p>

          <div className="mt-4 grid gap-3">
            {thankYouHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[12px] border-l-[3px] border-[#15c978] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(16,24,32,0.05)]"
              >
                <p className="text-[15px] font-black tracking-[-0.03em] text-[#13213c]">
                  ✓ {item.title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.35] text-[#5d6782]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-[3px] border-[#f7a61f] bg-[#fffaf2] px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-[#1a2740]">
            <ClipboardIcon className="h-5 w-5 text-[#f19a29]" />
            <h3 className="text-[16px] font-black tracking-[-0.03em]">
              Cómo Será La Llamada
            </h3>
          </div>

          <div className="mt-4 grid gap-3">
            {thankYouCallSteps.map((item) => (
              <div
                key={item.title}
                className="rounded-[14px] border-l-[3px] border-[#4a80f0] bg-[#f8fafc] px-4 py-4"
              >
                <div className="flex items-center gap-2 text-[15px] font-black tracking-[-0.03em] text-[#1a2740]">
                  {item.icon === "bolt" ? (
                    <BoltIcon className="h-4 w-4 text-[#ff8f2d]" />
                  ) : item.icon === "user" ? (
                    <UserIcon className="h-4 w-4 text-[#7b52ff]" />
                  ) : (
                    <FocusIcon className="h-4 w-4 text-[#ffae2d]" />
                  )}
                  <span>{item.title}</span>
                </div>
                <p className="mt-3 text-[14px] leading-[1.45] text-[#5d6782]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-[3px] border-[#4a80f0] bg-[#eef5ff] px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-[#2450c5]">
            <BadgeCheckIcon className="h-5 w-5 text-[#59cb8f]" />
            <h3 className="text-[16px] font-black tracking-[-0.03em]">
              Ten Esta Info Lista
            </h3>
          </div>

          <div className="mt-4 grid gap-3">
            {thankYouInfoList.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-[12px] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(16,24,32,0.04)]"
              >
                <span className="mt-0.5 inline-flex text-[#7dd8a1]">
                  <FilledCheckIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-black tracking-[-0.03em] text-[#13213c]">
                    {item.title}
                  </p>
                  <p className="text-[13px] leading-[1.35] text-[#5d6782]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-[3px] border-[#f08fd0] bg-white px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-[#1a2740]">
            <QuestionIcon className="h-5 w-5 text-[#f55ea9]" />
            <h3 className="text-[16px] font-black tracking-[-0.03em]">
              Preguntas Rápidas
            </h3>
          </div>

          <div className="mt-4 grid gap-3">
            {thankYouFaqs.map((item) => (
              <div
                key={item.title}
                className="rounded-[14px] border-l-[3px] border-[#8d5bff] bg-[#fcfcfe] px-4 py-4"
              >
                <p className="text-[15px] font-black tracking-[-0.03em] text-[#1a2740]">
                  {item.title}
                </p>
                <p className="mt-3 text-[14px] leading-[1.45] text-[#5d6782]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-[3px] border-[#ffbe2e] bg-[#1e2639] px-5 py-8 text-center text-white md:px-6">
          <div className="flex justify-center text-[34px]">
            <PhonePadIcon className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-[17px] leading-[1.4] font-semibold tracking-[-0.03em]">
            Mantén tu teléfono cerca y con{" "}
            <span className="font-black text-[#ffbe2e]">sonido activado.</span>
          </h3>
          <p className="mt-3 text-[14px] leading-[1.5] text-white/80 italic">
            Si ves una llamada entrante en los próximos{" "}
            <span className="font-black text-[#ffbe2e]">15 minutos</span> -
            somos nosotros. ¡Contéstala!
          </p>
          <p className="mx-auto mt-6 max-w-[380px] text-[14px] leading-[1.6] text-white/55">
            Best Life es una plataforma independiente de generación de leads de
            seguros. No somos una aseguradora. Los asesores que te contactarán
            están certificados y regulados por el departamento de seguros de su
            estado.
          </p>
        </section>
      </div>
    );
  }

  function renderQuestionnairePanel() {
    return (
      <div key={`panel-${panelKey}`} className="w-full">
        <div className="mx-auto flex w-full max-w-[760px] flex-col items-center">
          <div className="flex w-full items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="inline-flex h-9 w-9 items-center justify-center text-[#6b7280] [font-size:0] transition hover:text-[#101820]"
            >
              <BackArrowIcon className="h-[18px] w-[18px]" />
            </button>
            {renderProgress()}
            <div className="w-[70px]" />
          </div>

          <div className={`mt-7 text-center md:mt-9 ${animationClass}`}>
            <h2 className="mx-auto max-w-[720px] text-[30px] leading-[1.16] font-bold tracking-[-0.05em] text-[#101820] md:text-[46px]">
              {currentStep === "age" && "¿En qué grupo de edad estás?"}
              {currentStep === "goal" &&
                "Cuéntame, ¿qué te gustaría lograr con un seguro de vida?"}
              {currentStep === "state" && "Selecciona tu estado:"}
              {currentStep === "name" && "¿Cuál es tu nombre completo?"}
              {currentStep === "phone" &&
                "¿A qué número te enviamos tu cotización personalizada?"}
              {currentStep === "email" &&
                "¿Cuál es tu correo para enviarte la cotización?"}
            </h2>
          </div>

          {currentStep === "age" ? (
            <div className={`mt-8 grid w-full max-w-[420px] gap-4 md:mt-10 ${animationClass}`}>
              {ageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDirectChoice("ageGroup", option, "goal")}
                  className={optionButtonClass(answers.ageGroup === option)}
                >
                  {option}
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
                  onClick={() =>
                    handleDirectChoice("insuranceGoal", option, "state")
                  }
                  className={optionButtonClass(answers.insuranceGoal === option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {currentStep === "state" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
              <label
                className={`relative flex min-h-[78px] w-full cursor-pointer rounded-[16px] border bg-white px-5 py-4 text-left shadow-[0_4px_10px_rgba(16,24,32,0.08)] transition ${
                  selectedState === (answers.detectedState || "")
                    ? "border-[var(--brand)] shadow-[0_0_0_1px_var(--brand)]"
                    : "border-[#9c9c9c]"
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[17px] text-[#101820]">
                    {selectedState}{" "}
                    {selectedState === (answers.detectedState || selectedState) ? (
                      <span className="text-[14px] font-medium text-[var(--brand-dark)]">
                        (Detectado)
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 text-[13px] text-[#6b7280]">
                    Toca para cambiarlo
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="ml-4 flex items-center text-[20px] text-[#101820]"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
                <select
                  value={selectedState}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      state: event.target.value,
                    }))
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  <option value={answers.detectedState || "Florida"}>
                    {answers.detectedState || "Florida"}
                  </option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!selectedState) return;
                  if (!answers.state) {
                    setAnswers((prev) => ({
                      ...prev,
                      state: selectedState,
                    }));
                  }
                  transitionTo("name", "forward");
                }}
                disabled={!selectedState}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--brand-dark)]"
              >
                <span>Confirmar ubicación</span>
                <NextArrowIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          {currentStep === "name" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
              <input
                value={answers.firstName}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    firstName: event.target.value,
                  }))
                }
                placeholder="Nombre"
                className="h-[58px] rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
              />
              <input
                value={answers.lastName}
                onChange={(event) =>
                  setAnswers((prev) => ({
                    ...prev,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Apellido"
                className="h-[58px] rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
              />

              <button
                type="button"
                onClick={() => transitionTo("phone", "forward")}
                disabled={!answers.firstName.trim() || !answers.lastName.trim()}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[var(--brand-dark)]"
              >
                <span>Seguir</span>
                <NextArrowIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          {currentStep === "phone" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
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

                <input
                  value={formatPhoneDigits(answers.phoneNumber)}
                  onChange={(event) => {
                    setAnswers((prev) => ({
                      ...prev,
                      phoneNumber: event.target.value,
                    }));
                    setPhoneError("");
                  }}
                  placeholder="000 000 0000"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-[58px] min-w-0 flex-1 rounded-[16px] border border-[#9c9c9c] bg-white px-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
                />
              </div>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {phoneError}
              </p>

              <button
                type="button"
                onClick={() => {
                  const phoneValidationMessage = getPhoneValidationMessage(normalizedPhone);
                  if (phoneValidationMessage) {
                    setPhoneError(phoneValidationMessage);
                    return;
                  }
                  setPhoneError("");
                  transitionTo("email", "forward");
                }}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 hover:bg-[var(--brand-dark)]"
              >
                <span>Ver mi cotización ahora</span>
                <NextArrowIcon className="h-[18px] w-[18px]" />
              </button>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {submitError}
              </p>
            </div>
          ) : null}

          {currentStep === "email" ? (
            <div className={`mt-8 flex w-full max-w-[460px] flex-col gap-4 md:mt-10 ${animationClass}`}>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#6b7280]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16v10H4z" /><path d="m4 8 8 6 8-6" /></svg>
                </span>
                <input
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
                  className="h-[58px] w-full rounded-[16px] border border-[#9c9c9c] bg-white pl-12 pr-5 text-[17px] text-[#101820] outline-none transition focus:border-[var(--brand)]"
                />
              </div>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {emailError}
              </p>

              <button
                type="button"
                onClick={() => void submitLead()}
                disabled={isSubmittingLead}
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-[18px] font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 hover:bg-[var(--brand-dark)]"
              >
                {isSubmittingLead ? (
                  "Enviando..."
                ) : (
                  <>
                    <span>Ver mi cotización personalizada</span>
                    <FinalArrowIcon className="h-[18px] w-[18px]" />
                  </>
                )}
              </button>

              <p className="min-h-[22px] text-[14px] text-[#d14c4c]">
                {submitError}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap");
      `}</style>
      <header className="border-b border-black/6 bg-white/96 shadow-[0_6px_18px_rgba(18,31,53,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-4 md:relative md:justify-center">
          <Image
            src="/best-money-assets/logo-best-life.png"
            alt="Best Life"
            width={180}
            height={48}
            priority
            className="h-auto w-[148px] md:w-[160px]"
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

      {isSuccessPage ? (
        <section className="px-0 py-0 md:px-4 md:py-6">{renderSuccessPage()}</section>
      ) : (
        <>
          <div className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-[1200px] flex-col items-center px-3 pb-6 pt-8 md:px-4 md:pb-10 md:pt-4">
            <section
              className={`flex w-full flex-col items-center ${
                isQuestionnaire ? "justify-start" : "justify-center"
              }`}
            >
              <div className="w-full">
                {currentStep === "intro" ? renderIntroPanel() : renderQuestionnairePanel()}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
