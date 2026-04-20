import type { Metadata } from 'next'

import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Prelanding 3560 AN Pre4',
  description: 'Base vacia e independiente para el flujo 3560 AN Pre4.',
}

export default function Page() {
  return <PageClient />
}
