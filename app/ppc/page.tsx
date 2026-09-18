import QuickFunnel from "@/components/ppc-quick-funnel";

// Funnel corto de pay-per-call: 3 preguntas de selección simple y directo a
// /thank-ppc. Solo descalifica la edad (60 o más).
export default function PpcPage() {
  return <QuickFunnel />;
}
