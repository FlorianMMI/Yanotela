import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import ThemeColorMeta from "@/components/ThemeColorMeta";

export const metadata = {
  title: "Yanotela - Notes collaboratives",
  description: "Application de prise de notes collaborative",
  manifest: "/manifest.json",
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
      <body className="antialiased h-screen bg-background">
        <ThemeColorMeta />
        <DesktopLayout>
          {children}
        </DesktopLayout>
      </body>
    </html>
  );
}
