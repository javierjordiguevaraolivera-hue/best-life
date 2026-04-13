'use client'

import Image from 'next/image'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/79JQ12F/'

const bullets = [
  'Crecimiento indexado potencial',
  'Acceso a valor acumulado en vida',
  'Protección para tu familia',
]

function getRedirectHref() {
  const targetUrl = new URL(redirectTargetUrl)
  const searchParams = new URLSearchParams(window.location.search)

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  return targetUrl.toString()
}

function redirectToOffer() {
  window.location.href = getRedirectHref()
}

export default function PageClient() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-900">
      <div className="mx-auto max-w-[760px] px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-1 py-3">
          <Image
            src="/best-money-assets/logo-best-life.png"
            alt="Best Life"
            width={150}
            height={36}
            className="h-auto w-[122px] md:w-[150px]"
            priority
          />
          <Image
            src="/best-money-assets/secure-form-best-life2.png"
            alt="Secure Form"
            width={136}
            height={34}
            className="h-auto w-[116px] md:w-[136px]"
            priority
          />
        </div>

        <section className="mt-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1c63e6]">
            Beneficios IUL 2026
          </p>
          <h1 className="mx-auto mt-3 max-w-[11ch] text-[2.6rem] font-black leading-[0.9] tracking-[-0.06em] text-[#0e2d62] sm:text-[4rem]">
            Revisa si calificas para beneficios IUL.
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1.02rem] leading-7 text-slate-600 sm:text-[1.08rem]">
            Accede al registro y valida disponibilidad antes de que se cierren más cupos.
          </p>

          <div className="mx-auto mt-7 max-w-[620px] border-l-4 border-[#1c63e6] bg-white px-4 py-4 text-left shadow-[0_18px_38px_rgba(17,47,100,0.08)]">
            <ul className="space-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-[1rem] font-medium text-slate-800">
                  <span className="mt-[6px] inline-block h-2.5 w-2.5 bg-[#1c63e6]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={redirectToOffer}
            className="mt-8 inline-flex min-h-[64px] w-full max-w-[360px] items-center justify-center bg-[linear-gradient(180deg,#2f83ff_0%,#1c63e6_100%)] px-6 text-center text-[1.08rem] font-extrabold text-white shadow-[0_24px_42px_rgba(28,99,230,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Ver si califico ahora
          </button>

          <p className="mt-3 text-sm text-slate-500">
            Registro guiado. Toma menos de 1 minuto.
          </p>
        </section>
      </div>
    </main>
  )
}
