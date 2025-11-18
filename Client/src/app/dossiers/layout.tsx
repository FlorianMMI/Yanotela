import React from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";

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