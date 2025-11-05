"use client";

import React from "react";
import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";
import ReturnButton from "@/ui/returnButton";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

export default function Register() {
  const router = useRouter();

  return (
    <div className="h-full p-2.5 flex flex-col justify-between items-center font-geo gap-8 text-clrprincipal">
      <MobileFlashNoteButton />
      <ReturnButton />

      <div className="flex flex-col justify-center items-center gap-6 mt-4">
        <p
          className="
            text-center text-primary text-3xl font-bold md:min-w-[500px] after:content-[''] after:block after:w-full after:h-1 after:bg-primary after:rounded after:mt-8
          "
        >
          Bienvenue à bord 👋
        </p>

        <button
          onClick={() => router.push("/register/form")}
          className="w-full p-2.5 bg-primary rounded-lg flex items-center gap-3 hover:bg-primary-hover active:bg-primary-hover transition-colors cursor-pointer justify-center"
        >
          <Icon name="mail" className="text-white" size={20} />
          <span className="text-white text-sm font-medium font-['Gantari']">
            S&apos;inscrire avec un mail
          </span>
        </button>

       <div className="flex items-center w-full gap-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <p className="text-gris-100 text-sm font-normal font-gant">ou</p>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <GoogleAuthButton mode="register" /> 
      </div>

      <div className="flex flex-col justify-center items-center gap-2 mt-4">
        <p className="text-center justify-center text-clrprincipal text-xs font-gant font-light">
          Vous avez déjà un compte ?
        </p>
        <button
          onClick={() => router.push("/login")}
          className="text-center justify-center text-dangerous-100 hover:text-primary-hover active:text-primary-hover text-lg font-normal font-gant cursor-pointer"
        >
          Connectez-vous
        </button>
      </div>
    </div>
  );
}
