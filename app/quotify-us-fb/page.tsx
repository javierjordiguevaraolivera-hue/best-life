import type { Metadata } from "next";
import Script from "next/script";

import QuotifyUsFbPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Seguro de Vida",
  description: "La mejor cotización",
  icons: {
    icon: "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/cf4cbd00-2163-42f9-a91e-30ca76d82e8a/original.png",
    shortcut:
      "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/cf4cbd00-2163-42f9-a91e-30ca76d82e8a/original.png",
  },
  openGraph: {
    type: "website",
    title: "Seguro de Vida",
    description: "La mejor cotización",
    images: [
      {
        url: "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/af0bc9f8-21de-4c57-8e04-81aaaaf41031/original.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguro de Vida",
    description: "La mejor cotización",
    images: [
      "https://assets.prd.heyflow.com/flows/YXR7oey1nl7HBhqMQV2q/www/assets/af0bc9f8-21de-4c57-8e04-81aaaaf41031/original.png",
    ],
  },
};

export default function QuotifyUsFbPage() {
  const gtmId =
    process.env.NEXT_PUBLIC_QUOTIFY_US_FB_GTM_ID?.trim() ||
    process.env.NEXT_PUBLIC_QUOTIFY_US_GTM_ID?.trim();

  return (
    <>
      {gtmId ? (
        <>
          <Script id="quotify-us-fb-gtm" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="quotify-us-fb-gtm"
            />
          </noscript>
        </>
      ) : null}
      <QuotifyUsFbPageClient />
    </>
  );
}
