import type { Metadata } from "next";

import QuotifyUsEn2PageClient from "./page-client";

export const metadata: Metadata = {
  title: "New Benefit Available",
  description: "Answer 3 quick questions and find out what you qualify for.",
};

export default function QuotifyUsEn2Page() {
  return <QuotifyUsEn2PageClient />;
}
