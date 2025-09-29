"use client";

import React from "react";
import { useState, useEffect } from "react";
import Icon from "@/ui/Icon";
import ReturnButton from "@/ui/returnButton";
import ConfirmPassword from "@/ui/confirm-password";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Vérification que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    const registerData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      pseudo: formData.get("username") as string, // Nom corrigé pour correspondre au backend
      password: password,
    };

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(registerData),
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        // Si ce n'est pas du JSON, lire comme texte
        const textResponse = await response.text();
        console.error("Réponse non-JSON reçue:", textResponse);
        throw new Error("Le serveur a renvoyé une réponse inattendue");
      }

      if (response.ok) {
        setSuccess(responseData.message);
        // Optionnel : rediriger vers login après quelques secondes
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        if (responseData.errors) {
          // Gérer les erreurs de validation
          const errorMessages = responseData.errors
            .map((err: { errors: string[]; msg: string }) => err.msg)
            .join(", ");
          setError(errorMessages);
        } else {
          setError(responseData.error || "Erreur lors de l'inscription");
        }
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setError("Erreur de connexion au serveur: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérification de tous les champs pour activer/désactiver le submit
  useEffect(() => {
    console.log("Vérification du formulaire");
    if (
      username &&
      email &&
      firstName &&
      lastName &&
      password &&
      confirmPassword
    ) {
      setIsFormValid(true);
      console.log("Formulaire valide");
    } else {
      setIsFormValid(false);
    }
  }, [
    username,
    email,
    firstName,
    lastName,
    password,
    confirmPassword,
  ]);

  return (
    <div className="h-full p-2.5 pb-5 flex flex-col items-center font-geo gap-8 text-clrprincipal">
      <ReturnButton />

      <p
        className="
        text-center text-red-900 text-3xl font-bold after:content-[''] after:block after:w-full after:h-1 after:bg-primary after:rounded after:mt-8
      "
      >
        Bienvenue à bord 👋
      </p>

      <form
        onSubmit={handleSubmit}
        className=" flex flex-col justify-start items-center gap-5 "
      >
        {error && (
          <div className="w-full p-2.5 bg-red-100 border border-red-400 text-red-700 rounded-[10px] text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full p-2.5 bg-green-100 border border-green-400 text-green-700 rounded-[10px] text-sm">
            {success}
          </div>
        )}

        {/* Prénom, Nom, Mail */}
        <div className="w-full flex flex-col justify-start items-start gap-5">
          {/* Pseudo */}
          <div className="flex w-full justify-between items-center gap-5">
            <div className="flex flex-col">
              <p className="text-clrprincipal text-sm font-bold block">
                Pseudonyme*
              </p>
              <p className="text-zinc-500 text-xs font-light">
                *doit être unique
              </p>
            </div>
            <input
              type="text"
              name="username"
              placeholder="MartinJean05"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500"
            />
          </div>

          <div className="flex w-full justify-between items-center gap-5">
            <p className="justify-start text-clrprincipal font-bold text-sm">
              Prénom
            </p>
            <input
              type="text"
              name="firstName"
              placeholder="Jean"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500"
            />
          </div>

          <div className="flex w-full justify-between items-center gap-5">
            <p className="justify-start text-clrprincipal font-bold text-sm">
              Nom
            </p>
            <input
              type="text"
              name="lastName"
              placeholder="Martin"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500"
            />
          </div>

          <div className="self-stretch  flex flex-col justify-start items-start gap-2.5">
            <p className="justify-start text-clrprincipal font-bold text-sm">
              Mail
            </p>
            <input
              type="email"
              name="email"
              placeholder="Exemple@mail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 px-3  text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500"
            />
          </div>
        </div>



        {/* Mot de passe et confirmation */}
        <ConfirmPassword
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={isLoading}
        />

        <button
          type="submit"
          className={`w-full p-2.5 rounded-[10px] flex justify-between items-center overflow-hidden transition-all duration-300 ${
            isFormValid && !isLoading
              ? "bg-primary hover:bg-primary-hover active:bg-primary-hover cursor-pointer"
              : "bg-stone-500 cursor-not-allowed"
            }`}
          disabled={!isFormValid || isLoading}
        >
          <span
            className={`flex-1 text-center justify-center text-xl font-bold pointer-events-none ${isFormValid && !isLoading ? "text-white" : "text-stone-300"
              }`}
          >
            {isLoading ? "Inscription..." : "S'inscrire"}
          </span>
          <Icon
            name="arrow-barre"
            className={
              isFormValid && !isLoading
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
