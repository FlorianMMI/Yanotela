import React from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import DesktopLayout from "@/components/layout/DesktopLayout";

export default function FolderLayout({
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