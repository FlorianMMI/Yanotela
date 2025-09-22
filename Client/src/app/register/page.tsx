"use client";

import Image from "next/image";
import Icon from "../../components/Icon";
import { useState } from "react";
import Link from "next/link";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulaire inscription soumis');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleInputChange = () => {
    setIsFormValid(true);
  };

  const handleEmailButtonClick = () => {
    setShowForm(true);
  };

  return (
    <div className="h-screen p-2.5 flex flex-col justify-between items-center">
      <div className="w-full items-start flex">
        <Link href="/">
          <Icon
            name="arrow-ss-barre"
            className="text-black hover:scale-75 transition-transform duration-200"
            size={40}
          />
        </Link>
      </div>

      <div className=" p-2.5 flex flex-col justify-start items-center gap-7 ">
        <div className="w-72 flex justify-center items-center gap-2.5">
          <h1 className="flex-1 text-center justify-start text-red-900 text-4xl font-bold font-['Geologica']">
            Bienvenue a bord
          </h1>
        </div>

        <div className="self-stretch h-0 outline-[5px] outline-offset-[-2.50px] outline-red-900" />

        <div className="flex flex-col items-center gap-4 w-full">
          <button
            type="button"
            className="w-full p-2.5 bg-white border border-gray-300 rounded-[10px] flex justify-center items-center gap-3 hover:bg-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
          >
            <Icon name="google" className="text-red-default" size={20} />
            <span className="text-gray-700  text-sm font-medium font-['Gantari']">
              S'inscrire avec Google
            </span>
          </button>
          <div className="flex items-center w-full gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="text-gray-500 text-sm font-normal font-['Gantari']">
              ou
            </p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>

        <button
          type="button"
          id="emailbutton"
          onClick={handleEmailButtonClick}
          className={`w-full p-2.5 bg-red-default border rounded-[10px] flex justify-center items-center gap-3 hover:bg-red-hover active:bg-red-hover transition-colors cursor-pointer ${showForm ? 'hidden' : ''}`}
        >
          <Icon name="mail" className="text-white" size={20} />
          <span className="text-white text-sm font-medium font-['Gantari']">
            S'inscrire avec un mail
          </span>
        </button>

        <div id="formregister" className={`w-full flex flex-col justify-start items-center gap-8 ${showForm ? '' : 'hidden'}`}>
          <div className="self-stretch text-center justify-start text-red-900 text-3xl font-bold font-['Gantari']">
            Remplir le formulaire suivant
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col justify-start items-center gap-8 "
          >
            <div className="self-stretch flex flex-col justify-start items-start gap-5">
              <div className="self-stretch  flex justify-between items-start flex-col gap-5">
                <p className="justify-start text-black text-xl font-bold font-['Gantari']">
                  Prenom
                </p>
                <div className="w-full p-2.5 bg-white rounded-[10px] flex justify-start items-center gap-2.5 overflow-hidden">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Jean"
                    required
                    onChange={handleInputChange}
                    className="w-full bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                  />
                </div>
              </div>

              <div className="self-stretch  flex justify-between items-start flex-col gap-5">
                <p className="text-center justify-start text-black text-xl font-bold font-['Gantari']">
                  Nom
                </p>
                <div className="w-full p-2.5 bg-white rounded-[10px] flex justify-start items-center gap-2.5 overflow-hidden">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Martin"
                    required
                    onChange={handleInputChange}
                    className="w-full bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                  />
                </div>
              </div>

              <div className="self-stretch flex justify-between items-start flex-col gap-5">
                <p className="justify-start text-black text-xl font-bold font-['Gantari']">
                  Mail
                </p>
                <div className="w-full p-2.5 bg-white rounded-[10px] flex justify-start items-center gap-2.5 overflow-hidden">
                  <input
                    type="email"
                    name="email"
                    placeholder="Exemple@mail.com"
                    required
                    onChange={handleInputChange}
                    className="w-full bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="self-stretch  flex flex-col justify-start items-start gap-2.5">
              <div className="self-stretch flex flex-col justify-start items-start">
                <p className="justify-start text-black text-xl font-bold font-['Gantari']">
                  Pseudonyme
                </p>
                <p className="self-stretch justify-start text-zinc-500 text-sm font-normal font-['Gantari']">
                  Votre Pseudo doit etre unique
                </p>
              </div>
              <div className="self-stretch p-2.5 bg-white rounded-[10px] flex justify-start items-center gap-2.5 overflow-hidden">
                <input
                  type="text"
                  name="username"
                  placeholder="MartinJean05"
                  required
                  onChange={handleInputChange}
                  className="w-full bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                />
              </div>
            </div>

            <div className="self-stretch flex flex-col justify-start items-start gap-5">
              <div className="self-stretch  flex flex-col justify-start items-start gap-2.5">
                <div className="self-stretch flex flex-col justify-start items-start">
                  <p className="justify-start text-black text-xl font-bold font-['Gantari']">
                    Votre mot de passe
                  </p>
                  <p className="self-stretch justify-start text-zinc-500 text-sm font-normal font-['Gantari']">
                    Veuillez creer un mot de passe contenant au moins : un
                    chiffre, une majuscule et un caractere special.
                  </p>
                </div>
                <div className="self-stretch p-2.5 bg-white rounded-[10px] flex justify-between items-center overflow-hidden">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="**********"
                    required
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label={
                      showPassword
                        ? "Cacher le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    <Icon
                      name={showPassword ? "eye-close" : "eye"}
                      className="text-zinc-500 hover:text-zinc-700"
                      size={16}
                    />
                  </button>
                </div>
              </div>

              <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
                <p className="self-stretch justify-start text-black text-xl font-bold font-['Gantari']">
                  Confirmer votre mot de passe
                </p>
                <div className="self-stretch p-2.5 bg-white rounded-[10px] flex justify-between items-center overflow-hidden">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="**********"
                    required
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent text-black text-sm font-normal font-['Gantari'] outline-none placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label={
                      showConfirmPassword
                        ? "Cacher le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    <Icon
                      name={showConfirmPassword ? "eye-close" : "eye"}
                      className="text-zinc-500 hover:text-zinc-700"
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full p-2.5 rounded-[10px] flex justify-between items-center overflow-hidden transition-all duration-300 ${
                isFormValid
                  ? "bg-red-default hover:bg-red-hover active:bg-red-active cursor-pointer"
                  : "bg-stone-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid}
            >
              <span
                className={`flex-1 text-center justify-center text-xl font-bold font-['Gantari'] pointer-events-none ${
                  isFormValid ? "text-white" : "text-stone-300"
                }`}
              >
                S'inscrire
              </span>
              <Icon
                name="arrow-barre"
                className={
                  isFormValid
                    ? "text-white pointer-events-none"
                    : "text-stone-300 pointer-events-none"
                }
                size={40}
              />
            </button>
          </form>
        </div>

        <div className="p-2.5 flex flex-col justify-center items-center gap-2.5">
          <p className="text-center justify-center text-black text-l font-normal font-['Gantari']">
            Vous avez déjà un Compte ?
          </p>
          <Link
            href="/login"
            className="text-center justify-center text-red-default hover:text-red-hover active:text-red-hover text-xl font-normal font-['Gantari'] cursor-pointer"
          >
            Connectez-vous
          </Link>
        </div>
      </div>

      <div></div>
    </div>
  );
}
