"use client";

import React from "react";
import ReturnButton from "@/ui/returnButton";
import { useRouter } from "next/navigation";
import RegisterFormComponent from '@/components/auth/RegisterForm';
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

export default function RegisterFormPage() {
  const router = useRouter();

  const handleRegisterSuccess = () => {
    // Afficher un message de succès et rediriger vers login
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4 overflow-y-auto">
      <div className="flex items-center justify-center">
        <MobileFlashNoteButton />
        
        <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-full flex items-center justify-center relative">
            <div className="absolute left-0 top-0 text-clrprincipal">
       <ReturnButton />
       </div>
      
          <h1 className="text-3xl font-bold text-primary mb-2">
            Bienvenue à bord
          </h1>
          </div>
          <p className="text-clrprincipal">
            Créez votre compte Yanotela
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-clrsecondaire p-6 md:p-8 rounded-xl shadow-lg">
          <RegisterFormComponent
            onSuccess={handleRegisterSuccess}
            showTitle={false}
            onSwitchToLogin={() => router.push('/login')}
            isInline={true} // Version complète
          />
        </div>

        </div>
      </div>
    </div>
  );
}
