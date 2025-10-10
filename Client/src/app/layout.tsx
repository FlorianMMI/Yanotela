import "./globals.css";
import React from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import AuthWrapper from "@/components/auth/AuthWrapper";

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
        <AuthWrapper>
          <DesktopLayout>
            {children}
          </DesktopLayout>
        </AuthWrapper>
      </body>
    </html>
  );
}
