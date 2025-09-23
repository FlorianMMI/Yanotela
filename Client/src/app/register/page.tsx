"use client";

import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";
import ReturnButton from "@/ui/returnButton";

export default function Register() {
  const router = useRouter();

  return (
    <div className="h-full p-2.5 flex flex-col items-center font-geo gap-8 text-black">
      <ReturnButton />

      <p className="
        text-center text-red-900 text-3xl font-bold
        after:content-[''] after:block after:w-full after:h-1 after:bg-red-default after:rounded after:mt-8
      ">
        Bienvenue à bord 👋
      </p>

      <button
        type="button"
        className="w-full p-2.5 bg-white rounded-lg flex items-center gap-3 hover:bg-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
      >
        <Icon name="google" className="text-red-default" size={20} />
        <span className="text-gray-700 text-xs w-full text-center font-gant">
          S&apos;inscrire avec Google
        </span>
      </button>

      <p className="text-2xl">
        ou
      </p>

      <button
        onClick={() => router.push('/register/form')}
        className="w-full p-2.5 bg-red-default rounded-lg flex items-center gap-3 hover:bg-red-hover active:bg-red-hover transition-colors cursor-pointer"
      >
        <Icon name="mail" className="text-white" size={20} />
        <span className="text-white text-xs w-full text-center font-gant">
          S&apos;inscrire avec un mail
        </span>
      </button>

      <div className="flex flex-col justify-center items-center gap-2 mt-4">
        <p className="text-center justify-center text-black text-xs font-gant font-light">
          Vous avez déjà un compte ?
        </p>
        <button
          onClick={() => router.push('/login')}
          className="text-center justify-center text-red-default hover:text-red-hover active:text-red-hover text-lg font-normal font-gant cursor-pointer"
        >
          Connectez-vous
        </button>
      </div>
    </div>
  );
}
