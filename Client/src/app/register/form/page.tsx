"use client";

import { useState, useEffect } from "react";
import Icon from "@/ui/Icon";
import ReturnButton from "@/ui/returnButton";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulaire inscription soumis");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Vérification mot de passe (au moins une majuscule, un chiffre et un caractère spécial)
  useEffect(() => {
    const passwordCriteria = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_-]).+$/;
    if (password === "") {
      setPasswordInvalid(false);
      return;
    }
    if (!passwordCriteria.test(password)) {
      setPasswordInvalid(true);
    } else {
      setPasswordInvalid(false);
    }
  }, [password]);

  // Vérification mot de passe/confirmation
  useEffect(() => {
    if (password === "" || confirmPassword === "") {
      setPasswordMismatch(false);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  }, [password, confirmPassword]);

  // Vérification de tous les champs pour activer/désactiver le submit
  useEffect(() => {
    if (
      username &&
      email &&
      firstName &&
      lastName &&
      password &&
      confirmPassword
    ) {
      if (!passwordMismatch) {
        setIsFormValid(true);
      } else {
        setIsFormValid(false);
      }
    } else {
      setIsFormValid(false);
    }
  }, [username, email, firstName, lastName, password, confirmPassword, passwordMismatch]);

  return (
    <div className="h-full p-2.5 flex flex-col items-center font-geo gap-8 text-black">
      <ReturnButton />

      <p className="
        text-center text-red-900 text-3xl font-bold
        after:content-[''] after:block after:w-full after:h-1 after:bg-red-default after:rounded after:mt-8
      ">
        Bienvenue à bord 👋
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col justify-start items-center gap-8 "
      >

        {/* Prénom, Nom, Mail */}
        <div className="w-full flex flex-col justify-start items-start gap-5">

          <div className="flex w-full justify-between items-center gap-5">
            <p className="justify-start text-black font-bold text-sm">
              Prénom
            </p>
            <input
              type="text"
              name="firstName"
              placeholder="Jean"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-white text-black font-light outline-none placeholder-zinc-500"
            />
          </div>  

          <div className="flex w-full justify-between items-center gap-5">
            <p className="justify-start text-black font-bold text-sm">
              Nom
            </p>
            <input
              type="text"
              name="lastName"
              placeholder="Martin"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-white text-black font-light outline-none placeholder-zinc-500"
            />
          </div>

          <div className="flex w-full justify-between items-center gap-5">
            <p className="justify-start text-black font-bold text-sm">
              Mail
            </p>
            <input
              type="email"
              name="email"
              placeholder="Exemple@mail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-white text-black font-light outline-none placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Pseudo */}
        <div className="self-stretch  flex flex-col justify-start items-start gap-2.5">
          <div className="flex flex-col">
            <p className="text-black text-sm font-bold block">
              Pseudonyme
            </p>
            <p className="text-zinc-500 text-xs font-light">
              Votre Pseudo doit être unique
            </p>
          </div>
          <input
            type="text"
            name="username"
            placeholder="MartinJean05"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 px-3 text-xs rounded-lg bg-white text-black font-light outline-none placeholder-zinc-500"
          />
        </div>

        {/* Mot de passe et confirmation */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">

          {/* Mot de passe */}
          <div className="self-stretch  flex flex-col justify-start items-start gap-2.5">
            <div className="flex flex-col">
              <p className="text-black text-sm font-bold block">
                Mot de passe
              </p>
              <p className={`text-zinc-500 text-xs font-light ${!passwordInvalid ? 'hidden' : ''}`}>
                Votre mot de passe doit contenir au moins : un chiffre, une
                majuscule et un caractère spécial.
              </p>
            </div>
            <div className="self-stretch p-2.5 bg-white rounded-[10px] flex justify-between items-center overflow-hidden">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="**********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-black text-sm font-normal outline-none placeholder-zinc-500"
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

          {/* Confirmation du mot de passe */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
            <p className="text-black text-sm font-bold block">
              Confirmer votre mot de passe
            </p>
            <p className={`text-red-500 text-xs font-light ${!passwordMismatch ? 'hidden' : ''}`}>
              Vos mots de passe ne correspondent pas.
            </p>
            <div className="self-stretch p-2.5 bg-white rounded-[10px] flex justify-between items-center overflow-hidden">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="**********"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent text-black text-sm font-normal outline-none placeholder-zinc-500"
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
            className={`flex-1 text-center justify-center text-xl font-bold pointer-events-none ${
              isFormValid ? "text-white" : "text-stone-300"
            }`}
          >
            S&apos;inscrire
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
  );
}
