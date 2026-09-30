import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RegistrarSW } from "@/components/site/RegistrarSW";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display-sans", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "¿Quién Sacó? — Directorio de sedes de pádel", template: "%s · ¿Quién Sacó?" },
  description:
    "Directorio de sedes de pádel: reservá cancha directo con cada club y sumate a partidos abiertos entre todas las sedes adheridas.",
  openGraph: { locale: "es_AR", type: "website", siteName: "¿Quién Sacó?" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "¿Quién Sacó?" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#FFF6E9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:text-sm focus:font-semibold"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="relative z-10">
          {children}
        </main>
        <Footer />
        <RegistrarSW />
      </body>
    </html>
  );
}
