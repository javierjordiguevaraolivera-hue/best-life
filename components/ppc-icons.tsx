// Íconos que usan el funnel y la página de llamada. Viven aparte para no
// duplicarlos en los dos archivos.

export function FilledCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
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

export function UserIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
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

export function ShieldCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 317.855 317.855" className={className} fill="currentColor">
      <path d="M158.929 317.855c-1.029 0-2.059-.159-3.051-.477-33.344-10.681-61.732-31.168-84.377-60.891-17.828-23.401-32.103-52.526-42.426-86.566C11.661 112.506 11.461 61.358 11.461 59.209c0-5.15 3.912-9.459 9.039-9.954.772-.075 78.438-8.048 132.553-47.347 3.504-2.546 8.249-2.543 11.753.001C218.906 41.207 296.582 49.18 297.36 49.256c5.123.5 9.034 4.807 9.034 9.953 0 2.149-.2 53.297-17.613 110.713-10.324 34.04-24.598 63.165-42.426 86.566-22.644 29.723-51.032 50.21-84.376 60.891-.992.317-2.021.476-3.05.476zM31.748 67.982c.831 16.784 4.062 55.438 16.604 96.591 21.405 70.227 58.601 114.87 110.576 132.746 52.096-17.916 89.335-62.711 110.713-133.202 12.457-41.074 15.653-79.434 16.472-96.134-22.404-3.269-80.438-14.332-127.186-45.785C112.175 53.648 54.153 64.713 31.748 67.982z" />
      <path d="M153.582 207.625c-2.372 0-4.68-.844-6.499-2.4l-36.163-30.926c-4.197-3.589-4.69-9.901-1.101-14.099 3.588-4.198 9.901-4.692 14.099-1.101l28.124 24.051 55.743-73.118c3.348-4.392 9.622-5.24 14.015-1.89 4.393 3.348 5.238 9.623 1.89 14.015l-62.155 81.53c-1.667 2.187-4.16 3.591-6.895 3.882-.353.037-.706.056-1.058.056z" />
    </svg>
  );
}

export function PhoneCallIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M6.6 3h-.2A3.4 3.4 0 0 0 3 6.4c0 8 6.6 14.6 14.6 14.6a3.4 3.4 0 0 0 3.4-3.4v-.2a1.6 1.6 0 0 0-1.2-1.6l-3.2-.8a1.6 1.6 0 0 0-1.6.5l-1 1.2a12.6 12.6 0 0 1-5.7-5.7l1.2-1a1.6 1.6 0 0 0 .5-1.6l-.8-3.2A1.6 1.6 0 0 0 6.6 3Z" />
    </svg>
  );
}

export function ClockIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 7v5.2l3.2 1.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoCostIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
      <path d="M14.6 9.1c-.5-.8-1.5-1.3-2.6-1.3-1.6 0-2.6.8-2.6 1.9 0 2.7 5.4 1.3 5.4 4.1 0 1.2-1.1 2.1-2.8 2.1-1.2 0-2.2-.5-2.7-1.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 6v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BadgeCheckIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
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

export function FamilyIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="6.8" cy="7.6" r="2.5" fill="currentColor" />
      <circle cx="14" cy="7.6" r="2.5" fill="currentColor" />
      <circle cx="19.4" cy="11.4" r="1.7" fill="currentColor" />
      <path d="M2.6 18c0-2.3 1.9-4.1 4.2-4.1s4.2 1.8 4.2 4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.8 18c0-2.3 1.9-4.1 4.2-4.1s4.2 1.8 4.2 4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.8 19.2c0-1.5 1.2-2.6 2.6-2.6s2.6 1.2 2.6 2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ChildrenIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="8.6" cy="8" r="2.7" fill="currentColor" />
      <circle cx="16.6" cy="9.8" r="2.1" fill="currentColor" />
      <path d="M4.2 18.4c0-2.4 2-4.4 4.4-4.4s4.4 2 4.4 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.2 19c0-1.9 1.5-3.4 3.4-3.4s3.4 1.5 3.4 3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 20.3s-7.4-4.6-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5-7.4 9.6-7.4 9.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatisticGrowIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 5v5a1 1 0 0 1-2 0V7.41l-5.29 5.3a1 1 0 0 1-1.16.18l-5.29-2.64-4.49 5.39A1 1 0 0 1 3 16a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41l5-6a1 1 0 0 1 1.22-.25l5.35 2.67L18.59 6H16a1 1 0 0 1 0-2h5a1 1 0 0 1 .38.08 1 1 0 0 1 .54.54A1 1 0 0 1 22 5ZM21 18H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2Z" />
    </svg>
  );
}

export function RetirementPlanIcon({ className = "h-[1em] w-[1em]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21 6.25C21 4.455 19.545 3 17.75 3H6.25C4.455 3 3 4.455 3 6.25v11.5C3 19.545 4.455 21 6.25 21h5.772a6.45 6.45 0 0 1-.709-1.5H6.25A1.75 1.75 0 0 1 4.5 17.75V8.5h15v2.814c.534.172 1.037.411 1.5.708V6.25ZM6.25 4.5h11.5a1.75 1.75 0 0 1 1.75 1.75V7h-15v-.75A1.75 1.75 0 0 1 6.25 4.5Z" />
      <path d="M23 17.5a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0Zm-5.5 0h2a.5.5 0 0 1 0 1H17a.5.5 0 0 1-.5-.491V15a.5.5 0 0 1 1 0v2.5Z" />
    </svg>
  );
}
