import React from "react";
import AuthWrapper from "@/components/auth/AuthWrapper";

export default function FolderDetailLayout({
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
