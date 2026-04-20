'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { trackLandingVisit } from '@/lib/track-landing-visit'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/79JQ12F/'

const heroBullets = [
  'Dinero en vida',
  'Sin examen médico',
  'Sin pérdidas',
  'Aprobación rápida',
]

const featureCards = [
  {
    title: 'Sin examen médico',
    description: 'Obtén aprobación rápida sin exámenes médicos en menos de 1 minuto',
    icon: 'shield',
  },
  {
    title: 'Aprobación rápida',
    description:
      'Evaluación simple diseñada para que puedas calificar rápido y sin estrés para acceder a tu dinero en vida.',
    icon: 'clock',
  },
  {
    title: 'Crecimiento indexado',
    description:
      'Haz que tu dinero crezca con el tiempo, pero con la tranquilidad de que no perderá valor en los momentos difíciles.',
    icon: 'lock',
  },
  {
    title: 'Protege a tu familia',
    description:
      'Genera respaldo para que tu familia mantenga su estilo de vida, cubra gastos y tenga acceso a dinero cuando lo necesite.',
    icon: 'group',
  },
]

function getRedirectHref() {
  const targetUrl = new URL(redirectTargetUrl)
  const searchParams = new URLSearchParams(window.location.search)

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  return targetUrl.toString()
}

function redirectToForm() {
  window.location.href = getRedirectHref()
}

function BulletCheck() {
  return (
    <span className="mt-[2px] inline-flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#cba443]">
      <svg viewBox="0 0 12 12" className="h-[8px] w-[8px]" fill="none" aria-hidden="true">
        <path d="m3 6.2 1.7 1.8L9 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function FeatureIcon({ type }: { type: string }) {
  if (type === 'clock') {
    return (
      <svg viewBox="0 0 28 28" className="h-[28px] w-[28px]" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="10.25" stroke="#242424" strokeWidth="1.9" />
        <path d="M14 8.3v6.1l4.1 2.35" stroke="#242424" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'lock') {
    return (
      <svg viewBox="0 0 28 28" className="h-[28px] w-[28px]" fill="none" aria-hidden="true">
        <path d="M8.6 12.2V9.8a5.4 5.4 0 1 1 10.8 0v2.4" stroke="#242424" strokeWidth="1.9" strokeLinecap="round" />
        <rect x="6.2" y="12.2" width="15.6" height="10.8" rx="2.2" stroke="#242424" strokeWidth="1.9" />
        <path d="M14 16.2v3.1" stroke="#242424" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'group') {
    return (
      <svg viewBox="0 0 28 28" className="h-[28px] w-[28px]" fill="none" aria-hidden="true">
        <circle cx="14" cy="10" r="3.2" stroke="#242424" strokeWidth="1.9" />
        <path d="M8.5 20.7c.7-2.8 2.8-4.4 5.5-4.4s4.8 1.6 5.5 4.4" stroke="#242424" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="7.15" cy="12" r="2.35" stroke="#242424" strokeWidth="1.7" />
        <circle cx="20.85" cy="12" r="2.35" stroke="#242424" strokeWidth="1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 28 28" className="h-[28px] w-[28px]" fill="none" aria-hidden="true">
      <path
        d="M14 4.2 21 6.6v6.45c0 4.8-2.88 8.14-7 10.18-4.12-2.04-7-5.38-7-10.18V6.6L14 4.2Z"
        stroke="#242424"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="m10.7 14.25 2.2 2.2 4.5-4.6" stroke="#242424" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PageClient() {
  const hasTrackedVisitRef = useRef(false)

  useEffect(() => {
    if (hasTrackedVisitRef.current) return
    hasTrackedVisitRef.current = true
    trackLandingVisit('/3560-an-pre3')
  }, [])

  return (
    <main
      className="min-h-screen bg-[#f4f4f4] text-[#0f2f5c]"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      <header className="border-b border-[#d9dde5] bg-[#f7f7f7]">
        <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between px-5 py-[14px] sm:px-8">
          <Image
            src="/best-money-assets/logo-best-life.png"
            alt="Best Life"
            width={180}
            height={44}
            priority
            className="h-auto w-[128px] sm:w-[160px]"
          />
          <Image
            src="/best-money-assets/secure-form-best-life2.png"
            alt="Secure form"
            width={210}
            height={52}
            priority
            className="h-auto w-[122px] sm:w-[158px]"
          />
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1000px] px-6 pb-[42px] pt-[62px] text-center sm:px-10 sm:pb-[88px] sm:pt-[64px]">
        <h1 className="mx-auto max-w-[365px] text-[30px] font-bold leading-[1.17] tracking-[-0.035em] text-[#143462] sm:max-w-[860px] sm:text-[68px] sm:leading-[1.08]">
          Aplica hoy para descubrir si puedes acceder a $850,000 con un Seguro IUL
        </h1>

        <p className="mx-auto mt-[28px] max-w-[390px] text-[18px] leading-[1.58] tracking-[-0.01em] text-[#6f7d92] sm:mt-[24px] sm:max-w-[900px] sm:text-[25px] sm:leading-[1.47]">
          Descubre si calificas para un IUL que te da acceso a tu dinero en vida. Sin examen médico. Sin complicaciones. Toma 60 segundos.
        </p>

        <div className="mx-auto mt-[28px] flex max-w-[338px] flex-wrap justify-center gap-x-[18px] gap-y-[14px] text-left sm:mt-[22px] sm:max-w-none sm:items-center sm:gap-x-[28px] sm:gap-y-[14px]">
          {heroBullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-[8px] text-[15px] font-semibold leading-[1.25] text-[#111827] sm:text-[18px]">
              <BulletCheck />
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={redirectToForm}
          className="mt-[28px] inline-flex min-h-[60px] w-full max-w-[359px] items-center justify-center rounded-[14px] bg-[#bc2035] px-6 text-center text-white shadow-[0_9px_22px_rgba(188,32,53,0.28)] transition-transform duration-200 hover:-translate-y-0.5 sm:mt-[28px] sm:min-h-[62px] sm:max-w-[252px] sm:rounded-[13px]"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '20px', fontWeight: 700 }}
        >
          Ver cuánto recibo
        </button>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1000px] px-6 pb-[42px] pt-[74px] sm:px-10 sm:pb-[52px] sm:pt-[54px]">
          <div className="mx-auto max-w-[980px] bg-white sm:px-[84px] sm:py-[88px]">
            <h2 className="mx-auto max-w-[370px] text-center text-[34px] font-bold leading-[1.52] tracking-[-0.03em] text-[#143462] sm:max-w-none sm:text-[39px] sm:leading-[1.18]">
              ¿Por qué elegir un Seguro de Vida IUL?
            </h2>

            <div className="mt-[52px] grid grid-cols-1 gap-y-[58px] sm:mt-[56px] sm:grid-cols-2 sm:gap-x-[74px] sm:gap-y-[62px]">
              {featureCards.map((feature) => (
                <article key={feature.title} className="flex flex-col items-center text-center">
                  <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[17px] border border-[#d5dbe5] bg-white shadow-[0_1px_0_rgba(16,24,40,0.02)] sm:h-[66px] sm:w-[66px]">
                    <FeatureIcon type={feature.icon} />
                  </div>

                  <h3 className="mt-[26px] text-[18px] font-medium leading-[1.25] tracking-[-0.02em] text-black sm:mt-[22px] sm:text-[18px]">
                    {feature.title}
                  </h3>

                  <p className="mt-[16px] max-w-[350px] text-[20px] leading-[1.6] tracking-[-0.01em] text-[#6f7d92] sm:max-w-[380px] sm:text-[18px] sm:leading-[1.45]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 pb-5 pt-3 text-center text-[9px] leading-[1.45] text-[#b8bec8] md:text-[10px]">
        <p>© 2025 Best Life. All Rights Reserved.</p>
        <p className="mx-auto mt-2 max-w-[920px]">
          This site is not part of Facebook or Meta Platforms, Inc. Additionally, this site is not endorsed by Facebook in any way. “Facebook” is a registered trademark of Meta Platforms, Inc.
        </p>
        <p className="mx-auto mt-2 max-w-[920px]">
          Best Life is an independent promotional and advertising service. This website and the services offered are not sponsored, affiliated with, endorsed, or administered by Facebook. The content on this site has not been reviewed, approved, or certified by Facebook or any of its related entities.
        </p>
      </footer>
    </main>
  )
}
