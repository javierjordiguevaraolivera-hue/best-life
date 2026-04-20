import type { Metadata } from 'next'

import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Pre-registro 3560',
  description:
    'Prelanding independiente para el flujo 3560 antes de redirigir al formulario.',
}

export default function Page() {
  return <PageClient />
}
