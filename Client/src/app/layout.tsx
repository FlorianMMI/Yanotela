import type { Metadata } from "next";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased md:py-4 h-screen bg-motif-bg">
        {children}
      </body>
    </html>
  );
}
