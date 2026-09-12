import type { Metadata } from "next";
import { LandingThemeProvider } from "./theme-context";
import { LandingView } from "./landing-view";

export const metadata: Metadata = {
  title: "Creative Drive. Semua cloud storage dalam satu dasbor",
  description:
    "Satukan Google Drive, Dropbox, OneDrive, MEGA, dan pCloud. Cari, pindah, dan sinkron antar-cloud tanpa unduh ke laptop.",
  openGraph: {
    title: "Creative Drive. Semua cloud storage dalam satu dasbor",
    description: "5 akun cloud, 1 kendali bersih. Untuk desainer, videografer, fotografer, dan freelancer.",
    type: "website",
  },
};

export default function MarketingPage() {
  return (
    <LandingThemeProvider>
      <LandingView />
    </LandingThemeProvider>
  );
}
