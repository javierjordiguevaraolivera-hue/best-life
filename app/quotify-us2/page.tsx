import type { Metadata } from "next";
import Script from "next/script";

import QuotifyUs2PageClient from "./page-client";

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

export default function QuotifyUs2Page() {
  return (
    <>
      <Script id="quotify-us2-meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '980723860687387');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=980723860687387&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      <QuotifyUs2PageClient />
    </>
  );
}
