import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import ThemeClientProvider from "@/components/theme/ThemeClientProvider";
import ThemeColorMeta from "@/components/theme/ThemeColorMeta";
import AuthWrapper from '@/components/auth/AuthWrapper';

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
    <html lang="fr">
      <body className="antialiased h-dvh bg-background">
        <ThemeClientProvider>
        <ThemeColorMeta />
        <AuthWrapper>
          <DesktopLayout>
            {children}
          </DesktopLayout>
        </AuthWrapper>
        </ThemeClientProvider>
      </body>
    </html>
  );
}
