import { Suspense } from "react";
import ThankPpcClient from "./thank-ppc-client";

// Thank you page de pay-per-call del funnel corto (/ppc). Número fijo.
export default function ThankPpcPage() {
  return (
    <Suspense fallback={null}>
      <ThankPpcClient />
    </Suspense>
  );
}
