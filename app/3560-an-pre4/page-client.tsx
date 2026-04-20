'use client'

import { useEffect, useRef, useState } from 'react'

import { trackLandingVisit } from '@/lib/track-landing-visit'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/79JQ12F/'

const insuranceOptions = [
  { label: 'Auto', icon: 'car', featured: true },
  { label: 'Bundle', icon: 'bundle', featured: true },
  { label: 'Home', icon: 'home' },
  { label: 'Renters', icon: 'building' },
  { label: 'Pet', icon: 'paw' },
]

const insurerLogos = [
  { label: 'PROGRESSIVE', className: 'text-[#2c78c9] italic font-black tracking-[-0.05em]' },
  { label: 'Allstate.', className: 'text-[#1846b4] font-bold tracking-[-0.04em]' },
  { label: 'Liberty Mutual', className: 'text-[#2d2d52] font-semibold tracking-[-0.04em]' },
  { label: 'The General', className: 'text-[#11874f] font-bold tracking-[-0.04em]' },
  { label: 'BRISTOL WEST', className: 'text-[#2b79c2] font-bold tracking-[-0.05em]' },
  { label: '120+ MORE', className: 'text-[#171717] font-semibold tracking-[0.01em]' },
]

function getRedirectHref(zipCode: string) {
  const targetUrl = new URL(redirectTargetUrl)
  const searchParams = new URLSearchParams(window.location.search)

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  if (zipCode.trim()) {
    targetUrl.searchParams.set('zip', zipCode.trim())
  }

  return targetUrl.toString()
}

function Icon({ type }: { type: string }) {
  if (type === 'car') {
    return (
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
        <path d="M5.5 15.5h13l-1.2-5a2 2 0 0 0-1.95-1.53H8.65A2 2 0 0 0 6.7 10.5l-1.2 5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="8" cy="16.5" r="1.5" fill="currentColor" />
        <circle cx="16" cy="16.5" r="1.5" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'bundle' || type === 'home') {
    return (
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
        <path d="M5.5 10.3 12 5l6.5 5.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 10v7h9v-7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'building') {
    return (
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
        <rect x="6" y="4.5" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 8.5h1M13 8.5h1M10 11.5h1M13 11.5h1M10 14.5h1M13 14.5h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
      <path d="M12 13.4c1.77 0 3.2-1.39 3.2-3.1S13.77 7.2 12 7.2s-3.2 1.39-3.2 3.1 1.43 3.1 3.2 3.1Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.4 17.6c.9-1.8 2.8-2.9 5.6-2.9s4.7 1.1 5.6 2.9M6.4 10.7a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM17.6 10.7a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path d="M7.7 5.8h2.1l1.1 3.1-1.6 1.6a13 13 0 0 0 4.2 4.2l1.6-1.6 3.1 1.1v2.1c0 .6-.5 1.1-1.1 1.1A12.2 12.2 0 0 1 5.6 6.9c0-.6.5-1.1 1.1-1.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StarBlock({ partial = false }: { partial?: boolean }) {
  return (
    <span className="relative inline-flex h-[23px] w-[23px] items-center justify-center overflow-hidden rounded-[2px] bg-[#1bb56d]">
      {partial ? <span className="absolute inset-y-0 right-0 w-[35%] bg-[#cfd5dc]" /> : null}
      <svg viewBox="0 0 24 24" className="relative z-[1] h-[14px] w-[14px]" fill="#fff" aria-hidden="true">
        <path d="m12 3.7 2.3 4.66 5.15.75-3.72 3.63.88 5.13L12 15.5l-4.61 2.37.88-5.13-3.72-3.63 5.15-.75L12 3.7Z" />
      </svg>
    </span>
  )
}

export default function PageClient() {
  const hasTrackedVisitRef = useRef(false)
  const [zipCode, setZipCode] = useState('80252')

  useEffect(() => {
    if (hasTrackedVisitRef.current) return
    hasTrackedVisitRef.current = true
    trackLandingVisit('/3560-an-pre4')
  }, [])

  return (
    <main
      className="min-h-screen bg-[#dfecef] text-[#071a3d]"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      <div className="mx-auto w-full max-w-[430px] bg-white">
        <section className="bg-[#181785] px-[14px] pb-[0px] pt-[14px] text-white">
          <header className="flex items-center justify-between">
            <div className="text-[18px] font-black uppercase tracking-[-0.05em]">Insurify</div>

            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                aria-label="Call"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-white/20 bg-white/8 text-white"
              >
                <PhoneIcon />
              </button>

              <button
                type="button"
                className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-[#91b6ff] bg-white px-[16px] text-[14px] font-semibold text-[#0f57d5] shadow-[0_0_0_2px_rgba(15,87,213,0.14)]"
              >
                Sign In
              </button>

              <button type="button" aria-label="Menu" className="text-white">
                <MenuIcon />
              </button>
            </div>
          </header>

          <div className="pb-[18px] pt-[26px] text-center">
            <h1 className="mx-auto max-w-[350px] text-[27px] font-bold leading-[1.2] tracking-[-0.04em] text-white">
              Compare Car Insurance Quotes in Real Time &amp; Save
            </h1>

            <p className="mx-auto mt-[17px] max-w-[300px] text-[15px] font-medium leading-[1.34] text-[#b9b8eb]">
              See rates from top insurers side-by-side in 2 minutes.
            </p>

            <div className="mt-[18px] grid grid-cols-2 gap-[7px]">
              {insuranceOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={[
                    'rounded-[8px] border border-white/22 bg-[linear-gradient(180deg,rgba(90,88,188,0.88)_0%,rgba(45,39,149,0.94)_100%)] px-[12px] text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
                    option.featured ? 'min-h-[78px]' : 'min-h-[62px]',
                  ].join(' ')}
                >
                  <div className="flex flex-col items-center justify-center gap-[9px] text-white">
                    <Icon type={option.icon} />
                    <span className="text-[12px] font-medium tracking-[-0.01em]">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <label className="mt-[12px] block rounded-[8px] bg-white px-[14px] pb-[10px] pt-[8px] text-left shadow-[0_1px_0_rgba(0,0,0,0.12)]">
              <span className="block text-[11px] leading-none text-[#6e7888]">Enter your ZIP code</span>
              <input
                type="text"
                inputMode="numeric"
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                className="mt-[8px] w-full border-0 p-0 text-[15px] font-medium leading-none tracking-[-0.01em] text-[#0c1733] outline-none"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                window.location.href = getRedirectHref(zipCode)
              }}
              className="mt-[14px] inline-flex min-h-[50px] w-full items-center justify-center rounded-[8px] bg-[#ff5a12] text-[16px] font-extrabold uppercase tracking-[-0.01em] text-white"
            >
              COMPARE
              <span className="ml-[10px] text-[22px] leading-none">→</span>
            </button>

            <div className="mt-[14px] flex items-center justify-center gap-[8px] text-[14px]">
              <span className="font-medium text-white">Excellent</span>
              <div className="flex items-center gap-[2px]">
                <StarBlock />
                <StarBlock />
                <StarBlock />
                <StarBlock />
                <StarBlock partial />
              </div>
              <span className="text-[15px] font-medium text-white">Trustpilot</span>
            </div>

            <p className="mt-[16px] text-[13px] font-medium text-[#c8c5ec]">
              Been here before?{' '}
              <a
                href={redirectTargetUrl}
                onClick={(event) => {
                  event.preventDefault()
                  window.location.href = getRedirectHref(zipCode)
                }}
                className="font-bold text-white underline underline-offset-2"
              >
                Get your quotes back.
              </a>
            </p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-x-[10px] gap-y-[14px] border-b border-[#e7ecf3] bg-white px-[14px] py-[16px] text-center">
          {insurerLogos.map((logo) => (
            <div
              key={logo.label}
              className={`flex min-h-[28px] items-center justify-center text-[11px] leading-none ${logo.className}`}
            >
              {logo.label}
            </div>
          ))}
        </section>

        <section className="bg-white px-[20px] pb-[46px] pt-[30px] text-center">
          <h2 className="mx-auto max-w-[350px] text-[28px] font-bold leading-[1.24] tracking-[-0.045em] text-[#081c44]">
            You drive, we&apos;ll help navigate
          </h2>

          <p className="mx-auto mt-[20px] max-w-[357px] text-[16px] leading-[1.68] tracking-[-0.01em] text-[#1a2645]">
            We help you take charge of your insurance-shopping journey with tools that make getting quotes easy and fast. And, we&apos;ll show you customer insights no one else has.
          </p>

          <div className="mt-[66px]">
            <div className="mx-auto max-w-[356px] text-[26px] font-bold leading-[1.28] tracking-[-0.04em] text-[#0a1d44]">
              Empowering everyone to compare, buy, and manage insurance in one place
            </div>

            <p className="mx-auto mt-[20px] max-w-[360px] text-[16px] leading-[1.72] tracking-[-0.01em] text-[#101d41]">
              For more than a decade, Insurify has lived up to its mission: comparing the most quotes in the least time to find you the best coverage for your money on auto, home, renters, and pet insurance. Our extensive database of user reviews, interactive calculators and proprietary scoring model help you research the insurer and coverage that makes the most sense for you and your family.
            </p>
          </div>

          <div className="mt-[72px]">
            <div className="text-[28px] font-extrabold tracking-[-0.05em] text-[#1718a6]">No. 1</div>
            <div className="mt-[16px] text-[24px] font-bold leading-[1.28] tracking-[-0.04em] text-[#091b44]">
              insurance comparison platform
            </div>
            <p className="mx-auto mt-[22px] max-w-[332px] text-[16px] leading-[1.66] tracking-[-0.01em] text-[#101d41]">
              According to TrustPilot, Google Reviews, ShopperApproved, and the BBB
            </p>
          </div>

          <div className="mt-[66px]">
            <div className="text-[28px] font-extrabold tracking-[-0.05em] text-[#1718a6]">197M+</div>
            <div className="mt-[16px] text-[24px] font-bold leading-[1.28] tracking-[-0.04em] text-[#091b44]">
              insurance quotes compared
            </div>
            <p className="mx-auto mt-[22px] max-w-[330px] text-[16px] leading-[1.66] tracking-[-0.01em] text-[#101d41]">
              We&apos;ve served millions of insurance quotes, so we know what a good deal looks like
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
