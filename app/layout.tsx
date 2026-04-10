import type { Metadata } from "next";
import PixelScripts from "./pixel-scripts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Best Life IUL Insurance",
  description:
    "Landing page inspired by the original BestMoney home insurance compare experience.",
  icons: {
    icon: "/best-money-assets/best-life-icon.png",
    shortcut: "/best-money-assets/best-life-icon.png",
    apple: "/best-money-assets/best-life-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PixelScripts />
        {children}
      </body>
    </html>
  );
}
