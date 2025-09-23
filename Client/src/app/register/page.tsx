"use client";

import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";
import ReturnButton from "@/ui/returnButton";

export default function Register() {
  const router = useRouter();

  return (
    <div className="h-full p-2.5 flex flex-col justify-between items-center font-geo gap-8 text-black">
      <ReturnButton />

      <div className="flex flex-col justify-center items-center gap-6 mt-4">

      <p className="
        text-center text-red-900 text-4xl font-bold md:min-w-[500px]
      ">
        Bienvenue à bord 👋
      </p>

      <div className="self-stretch h-0 outline-[5px] outline-offset-[-2.50px] outline-red-900" />

      <button
        type="button"
        className="w-full p-2.5 bg-white rounded-lg flex items-center gap-3 hover:bg-gray-200 active:bg-gray-50 transition-colors cursor-pointer justify-center"
      >
        <Icon name="google" className="text-red-default" size={20} />
        <span className="text-gray-700 text-sm font-medium font-['Gantari']">
          S&apos;inscrire avec Google
        </span>
      </button>

      <p className="text-2xl">
        ou
      </p>

      <button
        onClick={() => router.push('/register/form')}
        className="w-full p-2.5 bg-red-default rounded-lg flex items-center gap-3 hover:bg-red-hover active:bg-red-hover transition-colors cursor-pointer justify-center"
      >
        <Icon name="mail" className="text-white" size={20} />
        <span className="text-white text-sm font-medium font-['Gantari']">
          S&apos;inscrire avec un mail
        </span>
      </button>

      </div>

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
