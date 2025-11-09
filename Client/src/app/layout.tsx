import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import ThemeClientProvider from "@/components/theme/ThemeClientProvider";
import ThemeColorMeta from "@/components/theme/ThemeColorMeta";

export const metadata = {
  title: "Yanotela - Notes collaboratives",
  description: "Application de prise de notes collaborative",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, interactive-widget=resizes-content",
};

export const viewport = {
  themeColor: "#E9EBDB", // Couleur par défaut (light theme)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="fr" className="h-full">
      <body className="antialiased h-dvh bg-background">
        <ThemeClientProvider>
        <ThemeColorMeta />
        <DesktopLayout>
          {children}
        </DesktopLayout>
        </ThemeClientProvider>
      </body>
    </html>
  );
}
