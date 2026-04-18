import type { Metadata } from "next";
import Script from "next/script";

import QuotifyUsFbTagPageClient from "./page-client";

const GTM_CONTAINER_ID = "GTM-WZ4H2TNM";

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

export default function QuotifyUsFbTagPage() {
  return (
    <>
      <Script id="quotify-us-fb-tag-gtm" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="quotify-us-fb-tag-gtm"
        />
      </noscript>
      <QuotifyUsFbTagPageClient />
    </>
  );
}
