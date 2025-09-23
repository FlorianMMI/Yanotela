"use client";

import Image from "next/image";
import Icon from "../../components/Icon";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  
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
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }
    
    const registerData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      pseudo: formData.get('username') as string, // Nom corrigé pour correspondre au backend
      password: password,
    };

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registerData)
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Si ce n'est pas du JSON, lire comme texte
        const textResponse = await response.text();
        console.error('Réponse non-JSON reçue:', textResponse);
        throw new Error('Le serveur a renvoyé une réponse inattendue');
      }

      if (response.ok) {
        setSuccess(responseData.message);
        // Optionnel : rediriger vers login après quelques secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        if (responseData.errors) {
          // Gérer les erreurs de validation
          const errorMessages = responseData.errors.map((err: any) => err.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(responseData.error || 'Erreur lors de l\'inscription');
        }
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setError('Erreur de connexion au serveur: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
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
            
            <div className="self-stretch flex flex-col justify-start items-start gap-5">
              <div className="self-stretch  flex justify-between items-center flex-row  gap-5">
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
              disabled={!isFormValid || isLoading}
              className={`w-full p-2.5 rounded-[10px] flex justify-between items-center overflow-hidden transition-all duration-300 ${
                isFormValid && !isLoading
                  ? "bg-red-default hover:bg-red-hover active:bg-red-active cursor-pointer"
                  : "bg-stone-500 cursor-not-allowed"
              }`}
            >
              <span
                className={`flex-1 text-center justify-center text-xl font-bold font-['Gantari'] pointer-events-none ${
                  isFormValid && !isLoading ? "text-white" : "text-stone-300"
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
