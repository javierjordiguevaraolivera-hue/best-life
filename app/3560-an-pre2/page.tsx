import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Grow wealth with Indexed Universal Life',
  description: 'Build tax-advantaged wealth and protect your family with Indexed Universal Life.',
}

export default function Page() {
  return <PageClient />
}
