import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import localFont from "next/font/local";
import { LanguageProvider } from "@/i18n/language-provider";
import { site } from "@/lib/site";
import "@/styles/theme.css";

const sans = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: "normal",
  variable: "--font-latin-sans",
  display: "swap",
});
const ethiopic = localFont({
  src: "../fonts/benaiah.ttf",
  weight: "700",
  style: "normal",
  variable: "--font-ethiopic",
  display: "swap",
});

export const metadata: Metadata = {
  icons: { icon: site.logo },
  title: { default: site.name, template: `%s | ${site.name}` },
  description: "An Orthodox teaching library about repentance, the sacraments, the Church Fathers, and apologetics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${ethiopic.variable}`}>
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}

