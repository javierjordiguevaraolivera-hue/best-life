import type { Metadata } from "next";

import QuotifyUsPageClient from "./page-client";

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

export default function QuotifyUsPage() {
  return <QuotifyUsPageClient />;
}
