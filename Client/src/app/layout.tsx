import type { Metadata } from "next";
import { Gantari, Geologica } from "next/font/google";
import "./globals.css";

const gantari = Gantari({
  variable: "--font-gantari",
  subsets: ["latin"],
});

const geologica = Geologica({
  variable: "--font-geologica",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yanotela",
  description: "Yanotela facilite la prise de notes collaborative : créez, organisez et partagez !",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${gantari.variable} ${geologica.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
