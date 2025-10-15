import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";

export const metadata = {
  title: "Yanotela - Notes collaboratives",
  description: "Application de prise de notes collaborative",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="fr" className="h-full">
      <body className="antialiased h-screen bg-background">
        <DesktopLayout>
          {children}
        </DesktopLayout>
      </body>
    </html>
  );
}
