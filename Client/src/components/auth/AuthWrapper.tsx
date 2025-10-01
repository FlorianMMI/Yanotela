"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import React from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthRedirect(); // Vérifie l'authentification et redirige si nécessaire

  return <>{children}</>;
}