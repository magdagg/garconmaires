import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "../globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const label = IBM_Plex_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Admin | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${sans.variable} ${label.variable}`}>
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
