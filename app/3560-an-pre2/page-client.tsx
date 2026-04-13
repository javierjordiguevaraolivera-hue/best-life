'use client'

import Image from 'next/image'
import { useState } from 'react'

import { TrustpilotStars } from './art'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/79JQ12F/'

const featureCards = [
  {
    icon: '/best-money-assets/explore-freely.svg',
    title: 'Market-based growth',
    copy: 'Your IUL grows with the stock market, and has built-in loss protection.',
  },
  {
    icon: '/best-money-assets/tax-free.svg',
    title: 'Money you can use',
    copy: "Put it to use while you're alive for early retirement, tuition, and more.",
  },
  {
    icon: '/best-money-assets/family-protection.svg',
    title: 'Lifelong coverage',
    copy: 'Your loved ones get a guaranteed payout, no matter when you die.',
  },
]

const testimonials = [
  {
    platform: 'Google',
    rating: '4.6/5',
    reviews: '1070+ reviews',
    quote: 'Loved how easy it was to compare and customize the policy coverage amount.',
    name: 'Mike C.',
  },
  {
    platform: 'Trustpilot',
    rating: '4.8/5',
    reviews: '4,000+ reviews',
    quote: 'Loved the bonus complimentary estate planning aids.',
    name: 'K.L.',
  },
  {
    platform: 'Google',
    rating: '4.6/5',
    reviews: '1070+ reviews',
    quote: 'Ethos has brought me so much relief knowing my family will be taken care of.',
    name: 'Georgia O.',
  },
  {
    platform: 'Google',
    rating: '4.6/5',
    reviews: '1070+ reviews',
    quote: 'Excellent prices for insurance policies...especially considering NO EXAM!',
    name: 'Jim H.',
  },
  {
    platform: 'Trustpilot',
    rating: '4.8/5',
    reviews: '4,000+ reviews',
    quote: 'It took 5 minutes and I was insured instantly for 1.2 million.',
    name: 'Shirley W.',
  },
]

const faqs = [
  {
    question: 'How does an IUL work?',
    answer:
      "An IUL has 2 parts: lifelong coverage and cash value. Starting on day 1, the coverage helps protect your family with a death benefit that can help cover costs like your mortgage, children's tuition and more. Over time, your policy also builds cash value linked to the performance of a stock market index, for example the S&P 500. You may be able to access these funds during your life, and any remaining death benefit can go to your family.",
  },
  {
    question: 'Can I access money during my life?',
    answer:
      "Yes. This portion of your policy is called the cash value. Once you've built enough cash value, typically after 3 years, you can take loans against it. These funds can be used for retirement, emergencies, tuition, or other goals.",
  },
  {
    question: 'When can I access my money?',
    answer:
      'You can typically start accessing cash value within about 3 years, though timing depends on your funding level, product details, and how the indexed account performs over time.',
  },
  {
    question: 'How does the money-back guarantee work?',
    answer: 'You can cancel your policy within the first 30 days and receive a refund of premiums paid, subject to product terms and state availability.',
  },
]

const footerColumns = [
  {
    heading: 'Resources',
    items: [
      { label: 'Our policies', href: '/insurance/life-insurance-policies/' },
      { label: 'FAQs', href: '/faq/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Life insurance 101', href: '/life/life-insurance-101/' },
      { label: 'How it works', href: '/how-it-works/' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About us', href: '/about/' },
      { label: 'Our carriers', href: '/carriers/' },
      { label: 'Reviews', href: '/reviews/' },
      { label: 'Careers', href: '/careers/' },
      { label: 'Leadership', href: '/leadership/' },
    ],
  },
  {
    heading: 'Partnerships',
    items: [
      { label: 'Ethos for Agents', href: '/agents/' },
      { label: 'Agent Login', href: 'https://agents.ethoslife.com/login' },
      { label: 'Affiliate Program', href: '/affiliate-program/' },
    ],
  },
  {
    heading: 'Legal',
    items: [
      { label: 'Terms of Use', href: '/terms/' },
      { label: 'Privacy Policy', href: 'https://privacy.ethoslife.com/policies' },
      { label: 'Data Security', href: '/life/data-security-at-ethos/' },
      { label: 'Accessibility', href: '/accessibility/' },
      { label: 'Licenses', href: '/licenses/' },
    ],
  },
]

const footnotes = [
  "Guarantees are based on the claims-paying ability of the issuer. Lifelong protection depends on premium funding and policy performance. Cash value growth is not guaranteed and can vary.",
  'Trustpilot rating as of 1/28/2026. Google rating as of 1/6/2026. Forbes Advisor as of 8/2025. Best no exam life insurance according to Business Insider as of 3/2025.',
  'Money-back guarantee terms and eligibility can vary by policy and state. Loans accrue interest and unpaid loans can reduce the death benefit.',
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

function GoogleBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#edf5ff] px-3 py-2 text-[0.78rem] font-semibold text-[#26466d]">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.95rem] font-black text-[#4285f4] shadow-sm">
        G
      </span>
      <span>Google Reviews</span>
    </div>
  )
}

function TestimonialBadge({ platform }: { platform: string }) {
  if (platform === 'Trustpilot') {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#ecf4ff] px-3 py-2 text-[0.78rem] font-semibold text-[#165fcc]">
          <span className="font-black">Trustpilot</span>
          <TrustpilotStars />
        </div>
      </div>
    )
  }

  return <GoogleBadge />
}

function FaqIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="11" width="16" height="2" rx="1" fill="#4d6c97" />
      {!expanded ? <rect x="11" y="4" width="2" height="16" rx="1" fill="#4d6c97" /> : null}
    </svg>
  )
}

export default function PageClient() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] text-[#16335b]">
      <div className="mx-auto max-w-[1360px] px-[5px] pb-0 pt-0 sm:px-6 sm:pt-4 lg:px-8">
        <header className="hidden items-center justify-between px-0 py-3 sm:flex">
          <div className="flex items-center">
            <Image
              src="/best-money-assets/logo-best-life.png"
              alt="Best Life"
              width={180}
              height={44}
              priority
              className="h-auto w-[148px] sm:w-[168px] md:w-[180px]"
            />
          </div>
          <div className="flex items-center">
            <Image
              src="/best-money-assets/secure-form-best-life2.png"
              alt="Secure form"
              width={210}
              height={52}
              priority
              className="h-auto w-[138px] sm:w-[160px] md:w-[182px]"
            />
          </div>
        </header>

        <section className="relative mx-[-1rem] mt-0 max-w-[1380px] overflow-hidden rounded-b-[30px] rounded-t-none border-x-0 border-b-0 border-t-0 border-white/40 bg-[#16335B] shadow-none sm:mx-auto sm:mt-5 sm:rounded-[34px] sm:border sm:border-white/50 sm:shadow-[0_34px_90px_rgba(22,51,91,0.28)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#16335B_0%,#1B3C6C_38%,#215394_72%,#237BE9_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_34%,rgba(6,22,46,0.10)_100%)]" />
          <div className="absolute -right-[210px] -top-[210px] hidden h-[820px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.14)_20%,rgba(255,255,255,0.06)_36%,rgba(255,255,255,0.015)_52%,rgba(255,255,255,0)_70%)] sm:block" />
          <div className="absolute -right-[118px] -top-[102px] hidden h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(126,192,255,0.22)_0%,rgba(126,192,255,0.10)_34%,rgba(126,192,255,0)_68%)] sm:block" />
          <div className="absolute bottom-[-170px] left-[-110px] hidden h-[320px] w-[320px] rounded-full bg-[#0f57b8]/14 blur-3xl md:h-[390px] md:w-[390px] sm:block" />

          <div className="relative z-10 px-3 py-7 sm:px-6 md:px-10 md:py-8 lg:px-16 lg:py-12">
            <div className="flex justify-center sm:hidden">
              <Image
                src="/best-money-assets/logo-best-life.png"
                alt="Best Life"
                width={180}
                height={44}
                priority
                className="h-auto w-[156px] brightness-0 invert"
              />
            </div>

            <div className="mx-auto max-w-[650px] text-center text-white lg:mx-0 lg:max-w-[52%] lg:text-left">
              <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 text-[0.92rem] font-bold sm:mt-0 sm:gap-3 lg:text-[1.08rem] lg:justify-start">
                <span>4.8</span>
                <TrustpilotStars />
                <span className="font-semibold">4,000+ Trustpilot reviews</span>
              </div>

              <h1 className="mx-auto mt-6 max-w-[17ch] font-['Times_New_Roman',Times,serif] text-[2.55rem] font-medium leading-[0.94] tracking-[-0.045em] sm:max-w-[13ch] sm:text-[4rem] lg:mx-0 lg:max-w-[14.5ch] lg:text-[5.05rem]">
                <span className="block lg:whitespace-nowrap">Grow wealth with</span>
                <span className="block lg:whitespace-nowrap">Indexed Universal Life</span>
              </h1>

              <p className="mx-auto mt-4 max-w-[21ch] text-[1.02rem] leading-[1.5] text-white/92 sm:mt-5 sm:text-[1.28rem] sm:leading-8 lg:mx-0 lg:max-w-none lg:text-[1.42rem] lg:leading-[2.1rem] lg:whitespace-nowrap">
                Build tax-advantaged wealth and protect your family.
              </p>

              <div className="mt-8 flex flex-col gap-5 sm:max-w-[360px] lg:max-w-[370px]">
                <button
                  type="button"
                  onClick={redirectToOffer}
                  className="mx-auto min-h-[60px] w-[calc(100%-8px)] max-w-none rounded-[12px] bg-white px-6 text-center shadow-[0_18px_34px_rgba(12,52,110,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#eaf3ff] sm:w-full sm:max-w-[340px] lg:mx-0 lg:max-w-none lg:min-h-[62px] lg:rounded-[13px]"
                >
                  <span className="text-[1.08rem] font-black tracking-[-0.01em] text-[#16335B] lg:text-[1.12rem]">Check my price</span>
                </button>

                <a
                  href="#iul-faq"
                  className="mx-auto inline-block border-b border-white pb-[2px] text-center text-[1rem] font-normal leading-none text-white lg:text-[1.14rem]"
                >
                  See how IULs work
                </a>
              </div>

              <div className="mt-10 flex items-end justify-center gap-4 sm:gap-6 lg:justify-start lg:gap-7">
                <div className="flex h-[56px] w-[132px] items-center justify-center rounded-[8px] bg-white/20 px-2 sm:h-[64px] sm:w-[170px] sm:bg-transparent sm:px-0 lg:h-[74px] lg:w-[196px] lg:justify-start">
                  <Image
                    src="/best-money-assets/busines-acredited-bbb.avif"
                    alt="Business accredited BBB"
                    width={220}
                    height={84}
                    className="h-auto w-[122px] object-contain opacity-95 grayscale brightness-[2.2] contrast-[0.88] sm:w-[148px] lg:w-[176px]"
                    sizes="(max-width: 640px) 122px, (max-width: 1024px) 148px, 176px"
                  />
                </div>

                <div className="flex h-[56px] w-[132px] items-center justify-center rounded-[8px] bg-white/10 px-2 sm:h-[64px] sm:w-[170px] sm:bg-transparent sm:px-0 lg:h-[74px] lg:w-[196px] lg:justify-start">
                  <Image
                    src="/best-money-assets/regulado y aprobado.png"
                    alt="Regulado y aprobado"
                    width={220}
                    height={84}
                    className="h-auto w-[116px] object-contain opacity-95 grayscale brightness-[2.25] contrast-[0.9] sm:w-[142px] lg:w-[168px]"
                    sizes="(max-width: 640px) 116px, (max-width: 1024px) 142px, 168px"
                  />
                </div>
              </div>

              <div className="mt-6 hidden justify-center lg:hidden">
                <Image
                  src="/best-money-assets/man-on-phone.png"
                  alt="Person checking an IUL quote on a phone"
                  width={533}
                  height={661}
                  priority
                  className="h-auto w-[290px] max-w-none drop-shadow-[0_28px_60px_rgba(14,54,116,0.28)] sm:w-[330px]"
                  sizes="(max-width: 640px) 310px, 360px"
                />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 z-0 hidden h-full w-[47%] items-end justify-end lg:flex">
            <div className="absolute bottom-[10%] right-[11%] h-[390px] w-[390px] rounded-full border border-white/10 bg-white/8 blur-[2px]" />
            <Image
              src="/best-money-assets/man-on-phone.png"
              alt="Person checking an IUL quote on a phone"
              width={533}
              height={661}
              priority
              className="relative bottom-0 right-4 h-auto w-[455px] max-w-none drop-shadow-[0_24px_54px_rgba(13,53,112,0.24)] xl:w-[495px]"
              sizes="(max-width: 1280px) 490px, 555px"
            />
          </div>
        </section>

        <section id="iul-benefits" className="mx-auto mt-0 rounded-[28px] px-0 py-0 md:mt-12 md:px-0 md:py-2">
          <div className="rounded-none border-0 bg-transparent px-3 py-8 sm:rounded-[28px] sm:border sm:border-[#dbe8ff] sm:bg-[linear-gradient(180deg,#edf4ff_0%,#f7fbff_100%)] sm:px-5 sm:py-12 md:px-12 md:py-16">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 className="font-[Georgia,'Times_New_Roman',serif] text-[2.25rem] font-bold leading-[1.02] text-[#16335b] sm:text-[3.6rem]">
                What you get with an IUL
              </h2>
              <p className="mx-auto mt-4 max-w-[28ch] text-[1.02rem] leading-8 text-[#34527a]/80 sm:max-w-[34ch] sm:text-[1.22rem]">
                IUL is permanent life insurance that also builds tax-advantaged wealth.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featureCards.map((card) => (
                <article
                  key={card.title}
                  className="flex h-full flex-col rounded-[22px] border border-[#d7e5ff] bg-white px-6 py-8 text-center shadow-[0_22px_55px_rgba(35,123,233,0.10)]"
                >
                  <div className="mx-auto flex min-h-[54px] min-w-[54px] items-center justify-center">
                    <Image src={card.icon} alt={card.title} width={50} height={50} className="h-[50px] w-[50px]" />
                  </div>
                  <h3 className="mt-5 text-[1.45rem] font-bold leading-tight text-[#1c5fc2]">{card.title}</h3>
                  <p className="mt-3 text-[1rem] leading-7 text-[#34527a]/82">{card.copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={redirectToOffer}
                className="min-h-[58px] w-full max-w-[340px] rounded-[12px] bg-[#237BE9] px-6 text-center shadow-[0_20px_40px_rgba(35,123,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1868d4]"
              >
                <span className="text-[1.05rem] font-black tracking-[-0.01em] text-[#16335B]">Check my price</span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-[#dbe8ff] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-5 py-10 shadow-[0_18px_45px_rgba(35,123,233,0.08)] md:px-8 md:py-12">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#237BE9]">Customer reviews</p>
            <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-[2.3rem] font-bold leading-tight text-[#16335b] sm:text-[3.2rem]">
              See why people trust Best Life
            </h2>
          </div>

          <div className="mt-8 flex snap-x gap-5 overflow-x-auto pb-2">
            {testimonials.map((testimonial) => (
              <article
                key={`${testimonial.platform}-${testimonial.name}`}
                className="min-h-[360px] w-[290px] shrink-0 snap-start rounded-[24px] border border-[#dbe8ff] bg-[#fbfdff] p-7 shadow-[0_14px_32px_rgba(35,123,233,0.08)] md:w-[360px]"
              >
                <TestimonialBadge platform={testimonial.platform} />
                <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#34527a]/85">
                  <span>{testimonial.rating}</span>
                  <span>{testimonial.reviews}</span>
                </div>
                <blockquote className="mt-8">
                  <p className="text-[1.45rem] leading-[1.45] text-[#16335b]">"{testimonial.quote}"</p>
                  <footer className="mt-8 text-[1rem] font-semibold text-[#1f4a82]">{testimonial.name}</footer>
                </blockquote>
              </article>
            ))}
          </div>
        </section>

        <section id="iul-faq" className="mt-12 rounded-[30px] border border-[#dbe8ff] bg-[linear-gradient(180deg,#eaf2ff_0%,#f7fbff_100%)] px-5 py-10 md:px-8 md:py-12">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
            <div className="lg:sticky lg:top-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#237BE9]">FAQ</p>
              <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-[2.3rem] font-bold leading-tight text-[#16335b] sm:text-[3.1rem]">
                Common IUL questions
              </h2>
              <p className="mt-4 max-w-[34ch] text-[1.05rem] leading-7 text-[#34527a]/80">
                Clear answers, cleaner layout, and the same next step if the visitor is ready to check pricing.
              </p>
              <button
                type="button"
                onClick={redirectToOffer}
                className="mt-8 min-h-[58px] w-full max-w-[340px] rounded-[12px] bg-[#237BE9] px-6 text-center shadow-[0_20px_40px_rgba(35,123,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1868d4]"
              >
                <span className="text-[1.05rem] font-black tracking-[-0.01em] text-[#16335B]">Check my price</span>
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index

                return (
                  <article key={faq.question} className="overflow-hidden rounded-[22px] border border-[#d7e5ff] bg-white shadow-[0_10px_25px_rgba(35,123,233,0.08)]">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[1.08rem] font-semibold text-[#16335b] sm:text-[1.16rem]">{faq.question}</span>
                      <span className="shrink-0">
                        <FaqIcon expanded={isOpen} />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-[#e8f0ff] px-6 py-5 text-[1rem] leading-7 text-[#34527a]/82">{faq.answer}</div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-14 bg-[#10294f] text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
            <div>
              <h3 className="text-[1.25rem] font-semibold">Contact Us</h3>
              <div className="mt-5 space-y-1 text-white/82">
                <p className="font-medium text-white">Mailing Address</p>
                <p>1606 Headway Circle</p>
                <p>#9013</p>
                <p>Austin, TX 78754</p>
              </div>
              <div className="mt-5 space-y-2 text-white/82">
                <a href="tel:+14159150665" className="block font-semibold text-white">
                  (415) 915-0665
                </a>
                <a href="mailto:support@ethoslife.com" className="block font-semibold text-white">
                  Email us
                </a>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <a href="https://www.facebook.com/ethosinsurance/" aria-label="Facebook">
                  <Image src="/best-money-assets/facebook.png" alt="Facebook" width={18} height={18} />
                </a>
                <a href="https://www.instagram.com/getethoslife/" aria-label="Instagram">
                  <Image src="/best-money-assets/instagram.png" alt="Instagram" width={18} height={18} />
                </a>
                <a href="https://www.linkedin.com/company/ethoslife/" aria-label="LinkedIn">
                  <Image src="/best-money-assets/linkedin.png" alt="LinkedIn" width={18} height={18} />
                </a>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {footerColumns.map((column) => (
                <div key={column.heading}>
                  <h4 className="text-[1rem] font-semibold">{column.heading}</h4>
                  <ul className="mt-4 space-y-3 text-sm text-white/78">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <a href={item.href}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-8 text-sm leading-6 text-white/72">
            <p>
              ©2026 Ethos Technologies Inc. Ethos operates in some states as Ethos Life Insurance Services. Products and features may
              not be available in all states.
            </p>
            <div className="mt-4 space-y-3">
              {footnotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
