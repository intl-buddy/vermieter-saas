import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "tefter",
  description: "Immobilienverwaltung, einfach und verständlich.",
  appleWebApp: {
    capable: true,
    title: "tefter",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#352b80",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-dvh bg-neutral-50 font-sans antialiased text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
