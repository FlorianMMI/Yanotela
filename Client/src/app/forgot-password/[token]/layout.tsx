import "./../../globals.css";
import React from "react";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="antialiased h-screen bg-motif-bg">
        {children}
      </body>
    </html>
  );
}
