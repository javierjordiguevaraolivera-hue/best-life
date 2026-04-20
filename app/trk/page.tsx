import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Life Insurance Protection for Family, Income, and Financial Security',
  description:
    'Learn how life insurance can help protect your family, replace income, cover major expenses, and support long-term financial security.',
  openGraph: {
    title: 'Life Insurance Protection for Family, Income, and Financial Security',
    description:
      'Learn how life insurance can help protect your family, replace income, cover major expenses, and support long-term financial security.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life Insurance Protection for Family, Income, and Financial Security',
    description:
      'Learn how life insurance can help protect your family, replace income, cover major expenses, and support long-term financial security.',
  },
}

export default function Page() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Life Insurance Protection for Family, Income, and Financial Security',
    description:
      'Learn how life insurance can help protect your family, replace income, cover major expenses, and support long-term financial security.',
    about: [
      'life insurance',
      'family protection',
      'income replacement',
      'financial security',
      'final expenses',
      'debt protection',
    ],
  }

  return (
    <main className="min-h-screen bg-white text-[#0f172a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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

        <p className="mt-4 max-w-[58ch] text-[16px] leading-7 text-[#64748b]">
          For many families, life insurance is a simple way to create financial protection, replace
          income, help with mortgage payments, cover final expenses, and support children or loved
          ones in the future.
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

        <section className="mt-10 rounded-[18px] border border-[#e7edf5] bg-[#f8fafc] px-5 py-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0b1f44]">
            Common reasons people look into coverage
          </h2>
          <p className="mt-2 text-[16px] leading-7 text-[#475569]">
            People often compare life insurance options to help with income replacement, debt
            protection, family support, legacy planning, and overall financial peace of mind.
          </p>
        </section>
      </div>
    </main>
  )
}
