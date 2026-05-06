"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDetectedZipCode, normalizeUsZip } from "@/lib/quotify-us";

const ageOptions = ["25 to 34", "35 to 44", "45 to 54", "55 to 65", "65 or older"];
const reasonOptions = ["Protect my family's income", "Life insurance", "Leave money for my kids", "Not sure yet"];
const securitySeals = [
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
type Step = "age" | "step2" | "step3" | "step4" | "step5" | "step6" | "disqualified";

type LocationResponse = {
  location?: string;
  source?: string;
  state?: string | null;
  zipCode?: string | null;
};

function formatLocationLabel(locationText: string, state: string) {
  const parts = locationText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts[0] && !/rates available/i.test(parts[0]) ? parts[0] : "";
  const resolvedState = state || parts[1] || "";

  if (city && resolvedState) return `${city}, ${resolvedState}`;
  if (city) return city;
  if (resolvedState) return resolvedState;
  return "";
}

function headlineFontSize(locationLabel: string) {
  if (locationLabel.length > 24) return 22;
  if (locationLabel.length > 18) return 24;
  return 27;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("1")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

function formatPhone(value: string) {
  const digits = normalizePhone(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function phoneErrorMessage(value: string) {
  const digits = normalizePhone(value);
  if (digits.length !== 10) return "Please enter a valid phone number.";
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return "Please enter a real phone number.";
  if (/^(\d)\1{9}$/.test(digits) || digits === "1234567890" || digits === "0123456789") {
    return "Please enter a real phone number.";
  }
  return "";
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 40 46" aria-hidden="true" className="h-[32px] w-[28px] shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
      <path
        d="M20 2.4 34 7.2v12.4c0 9.4-5.6 17.9-14 21.9C11.6 37.5 6 29 6 19.6V7.2L20 2.4Z"
        fill="#5ba7ff"
        stroke="#477ed6"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M20 5.5v32.4c6.4-3.6 10.7-10.5 10.7-18.3V9.8L20 5.5Z" fill="#2f8deb" opacity="0.95" />
      <path d="M12 10.3 20 7.5v30.4c-6-3.5-10-10.2-10-18.1v-9.5Z" fill="#7cc2ff" opacity="0.8" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[20px] w-[20px]" fill="none">
      <path
        d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[23px] w-[23px]" fill="none">
      <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 8 7.5 5.5L19.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[22px] w-[22px]" fill="none">
      <path d="M21 3 10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 3-7 18-4-7-7-4 18-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
      className={`h-[56px] w-full rounded-[3px] border border-[#8bbfe4] bg-[#349be0] px-4 text-center text-[20px] font-[800] leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.22)] transition ${
        selected ? "ring-2 ring-[#176ba7] ring-offset-2" : "hover:bg-[#2f92d4]"
      }`}
    >
      {label}
    </button>
  );
}

function TransitionOverlay({ fading }: { fading: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-20 flex justify-center bg-[#f4f4f4] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="mt-[126px] h-[132px] w-[132px]">
        <svg viewBox="0 0 132 132" className="h-full w-full">
          <circle cx="66" cy="66" r="47" fill="none" stroke="#d6d6d6" strokeWidth="2" />
          <circle
            cx="66"
            cy="66"
            r="47"
            fill="none"
            stroke="#332198"
            strokeDasharray="295"
            strokeDashoffset="295"
            strokeLinecap="round"
            strokeWidth="2.2"
            transform="rotate(-92 66 66)"
            className="animate-[drawCircle_1s_ease-out_forwards]"
          />
          <path
            d="M38 70 57 89 94 49"
            fill="none"
            stroke="#332198"
            strokeDasharray="82"
            strokeDashoffset="82"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth="2.4"
            className="animate-[drawCheck_0.38s_ease-out_0.82s_forwards]"
          />
        </svg>
      </div>
    </div>
  );
}

export default function QuotifyUsEn2PageClient() {
  const [step, setStep] = useState<Step>("age");
  const [ageGroup, setAgeGroup] = useState("");
  const [insuranceReason, setInsuranceReason] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [zipError, setZipError] = useState("");
  const [zipLookupFailures, setZipLookupFailures] = useState(0);
  const [isResolvingZip, setIsResolvingZip] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [transitionVisible, setTransitionVisible] = useState(false);
  const [transitionFading, setTransitionFading] = useState(false);
  const headlineSize = headlineFontSize(locationLabel);

  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      try {
        const response = await fetch("/api/location", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as LocationResponse;
        const label = formatLocationLabel(data.location || "", data.state || "");
        if (!cancelled) {
          const hasDetectedLocation = Boolean(data.zipCode || data.state);
          const detectedZip = hasDetectedLocation
            ? getDetectedZipCode({
                geoZip: data.zipCode || null,
                state: data.state || null,
              })
            : "";

          setLocationLabel(label);
          setSelectedState(data.state || "");
          setZipCode(detectedZip);
          setLocationStatus(hasDetectedLocation || label ? "ready" : "fallback");
        }
      } catch {
        if (!cancelled) setLocationStatus("fallback");
      }
    }

    void loadLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  function transitionTo(nextStep: Step) {
    setTransitionFading(false);
    setTransitionVisible(true);

    window.setTimeout(() => {
      setStep(nextStep);
    }, 1180);

    window.setTimeout(() => {
      setTransitionFading(true);
    }, 1320);

    window.setTimeout(() => {
      setTransitionVisible(false);
      setTransitionFading(false);
    }, 1880);
  }

  function handleAgeSelect(option: string) {
    setAgeGroup(option);

    if (option === "65 or older") {
      setStep("disqualified");
      return;
    }

    transitionTo("step2");
  }

  function handleReasonSelect(option: string) {
    setInsuranceReason(option);
    setStep(selectedState || zipCode ? "step4" : "step3");
  }

  async function submitZipCode() {
    const normalizedZip = normalizeUsZip(zipCode);

    if (normalizedZip.length !== 5) {
      setZipError("Enter a valid 5-digit ZIP code.");
      return;
    }

    setZipError("");
    setIsResolvingZip(true);

    try {
      const response = await fetch(`/api/zip/${normalizedZip}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as LocationResponse | null;

      if (!response.ok || data?.source !== "zippopotam" || normalizeUsZip(data.zipCode) !== normalizedZip) {
        if (zipLookupFailures >= 1) {
          setZipCode(normalizedZip);
          setStep("step4");
          return;
        }

        setZipLookupFailures((count) => count + 1);
        setZipError("Enter a valid U.S. ZIP code.");
        return;
      }

      setZipCode(normalizedZip);
      setZipLookupFailures(0);
      setSelectedState(data.state || "");
      setLocationLabel(formatLocationLabel(data.location || "", data.state || ""));
      setStep("step4");
    } catch {
      if (zipLookupFailures >= 1) {
        setZipCode(normalizedZip);
        setStep("step4");
        return;
      }

      setZipLookupFailures((count) => count + 1);
      setZipError("We could not verify that ZIP code. Try again.");
    } finally {
      setIsResolvingZip(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f4f4f4] px-0 py-0 text-black sm:flex sm:items-start sm:justify-center sm:px-6 sm:py-8">
      <section
        className="relative min-h-[100dvh] w-full max-w-[431px] overflow-hidden bg-[#f4f4f4] px-5 py-5 sm:min-h-0 sm:px-6"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <style jsx global>{`
          @keyframes drawCircle {
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes drawCheck {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
        {transitionVisible ? <TransitionOverlay fading={transitionFading} /> : null}
        {step === "disqualified" ? (
          <div className="mt-2 overflow-hidden bg-white text-center shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
            <div className="border-b-[3px] border-[#ffe500] bg-[#fffdf5] px-5 py-8">
              <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#eef7ff]">
                <ShieldIcon />
              </div>
              <h1 className="mx-auto mt-5 max-w-[330px] text-[29px] font-[900] leading-[1.1] tracking-[-0.02em] text-black">
                This Benefit May Not Be the Best Fit
              </h1>
            </div>
            <div className="px-6 py-7">
              <p className="mx-auto max-w-[350px] text-[20px] leading-[1.35] text-[#555b66]">
                Based on the age range selected, this specific program may not provide the strongest option right now.
              </p>
              <div className="mx-auto mt-6 max-w-[350px] rounded-[8px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-4 text-left">
                <p className="text-[16px] font-bold leading-[1.35] text-[#111827]">
                  Other coverage options may still be available.
                </p>
                <p className="mt-2 text-[15px] leading-[1.45] text-[#667085]">
                  A licensed professional can help compare alternatives designed for your goals, budget, and stage of life.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgeGroup("");
                  setStep("age");
                }}
                className="mt-7 h-[54px] w-full rounded-[3px] border border-[#8bbfe4] bg-[#349be0] px-4 text-[18px] font-[800] text-white shadow-[0_1px_2px_rgba(15,23,42,0.22)] transition hover:bg-[#2f92d4]"
              >
                Review My Answer
              </button>
            </div>
          </div>
        ) : step === "step2" ? (
          <div className="px-0 pt-[10px] text-center">
            <h1 className="mx-auto max-w-[360px] text-[29px] font-[900] leading-[1.18] tracking-[-0.025em] text-black">
              Your family deserves to be protected.
            </h1>
            <p className="mx-auto mt-[7px] max-w-[370px] text-[21px] leading-[1.18] tracking-[-0.01em] text-[#60636c]">
              Choose a life insurance plan based on your goals.
            </p>

            <div className="mt-[22px] h-[10px] overflow-hidden rounded-full bg-[#e6e6e6]">
              <div className="h-full w-[32%] bg-[#f36f13]" />
            </div>
            <p className="mt-[20px] text-[20px] leading-none text-black">Progress: 32%</p>

            <div className="mx-auto mt-[24px] h-px w-[96%] bg-[#e8e8e8]" />

            <h2 className="mx-auto mt-[8px] max-w-[380px] text-[28px] font-[900] leading-[1.16] tracking-[-0.025em] text-black">
              What's the main reason you're looking for life insurance?
            </h2>

            <div className="mt-[14px] grid gap-[12px] bg-white px-[11px] py-[2px] pb-[11px]">
              {reasonOptions.map((option) => (
                <ChoiceButton
                  key={option}
                  label={option}
                  selected={insuranceReason === option}
                  onClick={() => handleReasonSelect(option)}
                />
              ))}
            </div>
          </div>
        ) : step === "step3" ? (
          <div className="px-0 pt-[2px] text-center">
            <h1 className="mx-auto max-w-[390px] text-[22px] font-[900] leading-[1.05] tracking-[-0.035em] text-[#071222]">
              PROTECT WHAT MATTERS MOST.
            </h1>
            <h2 className="mx-auto mt-[14px] max-w-[340px] text-[26px] font-[900] leading-[1.1] tracking-[-0.035em] text-black">
              Get a quote in under 60 seconds.
            </h2>

            <div className="mt-[24px] h-[10px] overflow-hidden rounded-full bg-[#e6e9ef]">
              <div className="h-full w-[52%] rounded-full bg-[#ff6819]" />
            </div>
            <p className="mt-[15px] text-[16px] leading-none text-black">Progress: 52%</p>

            <div className="mx-auto mt-[25px] h-px w-[99%] bg-[#dadde3]" />

            <h3 className="mt-[20px] text-[27px] font-[900] leading-[1.08] tracking-[-0.035em] text-black">
              Enter your ZIP code:
            </h3>

            <div className="mt-[26px]">
              <input
                value={zipCode}
                onChange={(event) => {
                  setZipCode(normalizeUsZip(event.target.value));
                  setZipError("");
                }}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="ZIP code"
                className="h-[54px] w-full rounded-[6px] border border-[#126fff] bg-white px-[18px] text-center text-[22px] font-[800] tracking-[0.08em] text-black outline-none placeholder:text-[#98a2b3]"
              />
            </div>

            <p className="mt-3 min-h-[18px] text-center text-[13px] text-[#d92d20]">{zipError}</p>

            <button
              type="button"
              onClick={() => void submitZipCode()}
              disabled={isResolvingZip}
              className="mt-[13px] inline-flex h-[56px] w-full items-center justify-center gap-[12px] rounded-[6px] bg-[#349be0] px-4 text-[18px] font-[900] tracking-[-0.02em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition hover:bg-[#2f92d4]"
            >
              <MapPinIcon />
              {isResolvingZip ? "Checking..." : "Confirm ZIP code"}
              <span>→</span>
            </button>
          </div>
        ) : step === "step4" ? (
          <div className="px-0 pt-[10px] text-center">
            <h1 className="mx-auto max-w-[370px] text-[28px] font-[900] leading-[1.2] tracking-[-0.025em] text-black">
              Almost There. Let's Personalize Your Quote
            </h1>

            <div className="mt-[23px] h-[10px] overflow-hidden rounded-full bg-[#e6e9ef]">
              <div className="h-full w-[67%] rounded-full bg-[#ff6819]" />
            </div>
            <p className="mt-[23px] text-[22px] leading-none text-black">Progress: 67%</p>

            <div className="mx-auto mt-[33px] h-px w-[99%] bg-[#dadde3]" />

            <p className="mx-auto mt-[18px] max-w-[390px] text-[23px] font-[900] leading-[1.13] tracking-[-0.035em] text-black">
              We'll prepare your custom quote in under 60 seconds
            </p>

            <h2 className="mt-[20px] text-[29px] font-[900] leading-[1.1] tracking-[-0.035em] text-black">
              What's your name?
            </h2>

            <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
              <input
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setNameError("");
                }}
                placeholder="First Name"
                autoComplete="given-name"
                className="h-[70px] min-w-0 rounded-[6px] border-0 bg-[#ececec] px-[20px] text-[16px] text-black outline-none placeholder:text-[#a8abb3]"
              />
              <input
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setNameError("");
                }}
                placeholder="Last Name"
                autoComplete="family-name"
                className="h-[70px] min-w-0 rounded-[6px] border-0 bg-[#ececec] px-[20px] text-[16px] text-black outline-none placeholder:text-[#a8abb3]"
              />
            </div>

            <p className="mt-3 min-h-[18px] text-center text-[13px] text-[#d92d20]">{nameError}</p>

            <button
              type="button"
              onClick={() => {
                if (!firstName.trim() || !lastName.trim()) {
                  setNameError("Enter your first and last name.");
                  return;
                }
                setStep("step5");
              }}
              className="mt-[2px] inline-flex h-[56px] w-[90%] items-center justify-center gap-[14px] rounded-[7px] bg-[#349be0] px-4 text-[22px] font-[900] tracking-[-0.02em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition hover:bg-[#2f92d4]"
            >
              Continue
              <span className="text-[30px] font-[400] leading-none">→</span>
            </button>

            <div className="mx-auto mt-[35px] max-w-[360px] space-y-[22px] text-[21px] leading-[1.28] text-black">
              <p>*Rates vary by health, age, coverage amount, and carrier.</p>
              <p>Not all applicants qualify. Average savings comparison</p>
              <p>based on internal data. Licensed agents available to help.</p>
            </div>
          </div>
        ) : step === "step5" ? (
          <div className="px-0 pt-[10px] text-center">
            <h1 className="mx-auto max-w-[360px] text-[21px] font-[900] leading-[1.2] tracking-[-0.02em] text-[#5d6470]">
              🔐 Your quote is almost ready.
              <br />
              📞 An available agent can help you right now.
            </h1>

            <div className="mt-[20px] h-[10px] overflow-hidden rounded-full bg-[#e6e9ef]">
              <div className="h-full w-[88%] rounded-full bg-[#ff6819]" />
            </div>
            <p className="mt-[24px] text-[22px] leading-none text-black">Progress: 88%</p>

            <div className="mx-auto mt-[25px] h-px w-[99%] bg-[#dadde3]" />

            <h2 className="mt-[13px] text-[27px] font-[900] leading-[1.08] tracking-[-0.03em] text-black">
              Almost done,{firstName.trim() || "there"}!
            </h2>
            <h3 className="mx-auto mt-[26px] max-w-[310px] text-[29px] font-[900] leading-[1.12] tracking-[-0.035em] text-black">
              What's your phone number?
            </h3>

            <div className={`mt-[28px] overflow-hidden rounded-[5px] border ${phoneError ? "border-[#ff0037]" : "border-[#d8dde5]"}`}>
              <div className="flex h-[48px] items-center bg-[#ececec]">
                <div className="flex h-full min-w-[80px] items-center justify-center gap-2 border-r border-[#d8dde5] text-[14px] font-[700] uppercase text-[#777]">
                  <span>us</span>
                  <span className="text-[10px]">▼</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center bg-[#ececec] px-4">
                  <span className="mr-2 text-[18px] text-[#b8bbc2]">+1</span>
                  <input
                    value={formatPhone(phoneNumber)}
                    onChange={(event) => {
                      setPhoneNumber(event.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="000 000 0000"
                    className="h-full min-w-0 flex-1 bg-transparent text-[18px] text-black outline-none placeholder:text-[#b8bbc2]"
                  />
                </div>
              </div>
              {phoneError ? (
                <div className="flex items-center gap-2 border-t border-[#ffd3dc] bg-[#fff2f4] px-3 py-[12px] text-left text-[14px] text-[#ff0037]">
                  <span className="text-[22px] leading-none">×</span>
                  <span>{phoneError}</span>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                const error = phoneErrorMessage(phoneNumber);
                if (error) {
                  setPhoneError(error);
                  return;
                }
                setStep("step6");
              }}
              className="mt-[71px] inline-flex h-[56px] w-[95%] items-center justify-center gap-[14px] rounded-[7px] bg-[#349be0] px-4 text-[21px] font-[900] tracking-[-0.02em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition hover:bg-[#2f92d4]"
            >
              Get My Free Quote
              <span className="text-[30px] font-[400] leading-none">→</span>
            </button>

            <div className="mx-auto mt-[39px] max-w-[330px] space-y-[22px] text-[16px] font-[900] leading-[1.35] text-[#5d6470]">
              <p>💬 After reviewing, a licensed agent can answer any questions. No pressure, no spam.</p>
              <p>🔐 Your information is encrypted and secure.</p>
            </div>

            <div className="mt-[70px] flex items-end justify-center gap-5 px-2">
              {securitySeals.map((seal) => (
                <div key={seal.src} className="flex h-[32px] items-center justify-center">
                  <Image
                    src={seal.src}
                    alt={seal.alt}
                    width={seal.width}
                    height={seal.height}
                    className="h-auto max-h-[32px] w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : step === "step6" ? (
          <div className="px-0 pt-[18px] text-center">
            <h1 className="mx-auto max-w-[390px] text-[26px] font-[900] leading-[1.28] tracking-[-0.025em] text-black">
              PROTECT WHAT YOU LOVE MOST.
            </h1>
            <p className="mx-auto mt-[4px] max-w-[370px] text-[17px] leading-[1.3] text-[#60636c]">
              You could save up to 70% on life insurance.
            </p>

            <div className="mt-[26px] h-[10px] overflow-hidden rounded-full bg-[#e6e9ef]">
              <div className="h-full w-[97%] rounded-full bg-[#ff6819]" />
            </div>
            <p className="mt-[25px] text-[22px] leading-none text-black">Progress: 97%</p>

            <div className="mx-auto mt-[25px] h-px w-[99%] bg-[#dadde3]" />

            <h2 className="mx-auto mt-[4px] max-w-[390px] text-[28px] font-[900] leading-[1.22] tracking-[-0.035em] text-black">
              <span className="mr-2 inline-flex align-[-0.08em] text-[#d89bcc]">📩</span>
              {firstName.trim() || "there"}, What’s your email so we can send you the quote?
            </h2>

            <div className={`mt-[33px] flex overflow-hidden rounded-[6px] border ${emailError ? "border-[#ff0037]" : "border-[#3725ff]"}`}>
              <div className="flex h-[72px] min-w-[58px] items-center justify-center bg-[#ececec] text-[#6c7078]">
                <MailIcon />
              </div>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError("");
                }}
                inputMode="email"
                autoComplete="email"
                placeholder="Ej: email@example.com"
                className="h-[72px] min-w-0 flex-1 bg-[#ececec] px-[20px] text-[17px] text-black outline-none placeholder:text-[#777b84]"
              />
            </div>
            <p className="mt-3 min-h-[18px] text-center text-[13px] text-[#d92d20]">{emailError}</p>

            <p className="mx-auto mt-[7px] max-w-[360px] text-left text-[21px] leading-[1.34] text-black">
              🔐 Your information is safe. We only use it to send you your quote.
            </p>

            <button
              type="button"
              onClick={() => {
                if (!validEmail(email)) {
                  setEmailError("Enter a valid email address.");
                }
              }}
              className="mt-[29px] inline-flex h-[50px] w-[95%] items-center justify-center gap-[12px] rounded-[6px] bg-[#349be0] px-4 text-[17px] font-[900] tracking-[-0.02em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition hover:bg-[#2f92d4]"
            >
              View my personalized quote
              <PaperPlaneIcon />
            </button>

            <p className="mt-[15px] text-left text-[17px] leading-[1.35] text-[#60636c]">
              ⏳ Offer valid for a limited time.
            </p>

            <div className="mt-[63px] flex items-end justify-center gap-5 px-2">
              {securitySeals.map((seal) => (
                <div key={seal.src} className="flex h-[32px] items-center justify-center">
                  <Image
                    src={seal.src}
                    alt={seal.alt}
                    width={seal.width}
                    height={seal.height}
                    className="h-auto max-h-[32px] w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <header className="bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
          <div className="border-b-[3px] border-[#ffe500] bg-[#fffdf5] px-[12px] py-[26px]">
            <div className="flex items-start justify-center gap-[8px] text-center">
              <div className="pt-[3px]">
                <ShieldIcon />
              </div>
              <h1
                className="min-w-0 flex-1 font-[900] leading-[1.1] tracking-[-0.02em] text-black"
                style={{ fontSize: `${headlineSize}px` }}
              >
                <span className="block whitespace-nowrap">New Benefit Available</span>
                <span className="block whitespace-nowrap">in {locationLabel || "Your Area"}</span>
              </h1>
            </div>
          </div>
            </header>

            <div className="px-0 pt-[17px] text-center">
          <p className="mx-auto max-w-[390px] text-[21px] font-normal leading-[1.25] tracking-[-0.01em] text-[#60636c]">
            Answer 3 quick questions and find out exactly what you qualify for no cost, no commitment.
          </p>

          <div className="mx-auto mt-[22px] h-px w-[96%] bg-[#e8e8e8]" />

          <h2 className="mt-[6px] text-[29px] font-[900] leading-[1.1] tracking-[-0.025em] text-black">
            First, how old are you?
          </h2>

          <div className="mt-[14px] grid gap-[12px] bg-white px-[11px] py-[2px] pb-[11px]">
            {ageOptions.map((option) => (
              <ChoiceButton
                key={option}
                label={option}
                selected={ageGroup === option}
                onClick={() => handleAgeSelect(option)}
              />
            ))}
          </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
