import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import ThemeClientProvider from "@/components/theme/ThemeClientProvider";

export const metadata = {
  title: "Yanotela - Notes collaboratives",
  description: "Application de prise de notes collaborative",
  manifest: '/manifest.json',
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
        <DesktopLayout>
          {children}
        </DesktopLayout>
        </ThemeClientProvider>
      </body>
    </html>
  );
}
