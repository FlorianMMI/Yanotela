"use client";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}