import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/79JQ12F/'

export const metadata: Metadata = {
  title: 'Solicita los Beneficios IUL hoy mismo',
  description:
    'Descubre información actualizada sobre beneficios IUL y opciones disponibles para tu perfil.',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
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
