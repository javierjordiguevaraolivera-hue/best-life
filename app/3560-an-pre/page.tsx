import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Registro prioritario IUL 2026',
  description:
    'Conoce cómo funciona el registro previo para beneficios IUL y revisa si todavía hay cupos disponibles.',
}

export default function Page() {
  return <PageClient />
}
