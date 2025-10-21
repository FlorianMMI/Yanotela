"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Si l'utilisateur est connecté, rediriger vers /notes
      // Sinon, rediriger vers /login (qui affichera la Flash Note)
      router.replace(isAuthenticated ? "/notes" : "/login");
    }
  }, [router, isAuthenticated, loading]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}