import React from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import DesktopLayout from "@/components/layout/DesktopLayout";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
        {children}
    </AuthWrapper>
  );
}
