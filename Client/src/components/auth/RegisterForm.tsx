"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import ReturnButton from '@/ui/returnButton';
import ConfirmPassword from '@/ui/confirm-password';
import { Register } from '@/loader/loader';

interface RegisterFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  showLoginLink?: boolean;
  onSwitchToLogin?: () => void;
  className?: string;
  isInline?: boolean; // Si true, affiche le formulaire complet, sinon juste un lien
  isInSidebar?: boolean; // Pour différencier sidebar vs page
}

export default function RegisterForm({
  onSuccess,
  showTitle = true,
  showLoginLink = true,
  onSwitchToLogin,
  className = "",
  isInline = false,
  isInSidebar = false
}: RegisterFormProps) {
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

    // Critères de validation du mot de passe

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
      const result = await Register(registerData);
      
      if (result.success) {
        setSuccess(result.message || 'Compte créé avec succès !');
        if (onSuccess) {
          setTimeout(onSuccess, 3000);
        } else {
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } else {
        setError(result.error || "Erreur lors de l'inscription");
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
    if (username && email && firstName && lastName && password && confirmPassword) {
      const passwordCriteria = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_\-\.]).+$/;

      // Si les mots de passe ne correspondent pas
      if (password !== confirmPassword) {
        setIsFormValid(false);
        return;
      }

      // On vérifie les critères du mot de passe
      if (passwordCriteria.test(password)) {
        setIsFormValid(true);
      } else {
        setIsFormValid(false);
      }
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

  // Version simplifiée pour la sidebar (juste un lien)
  if (!isInline && !isInSidebar) {
    return (
      <div className={className}>
        {showTitle && (
          <h2 className="text-xl font-bold text-primary mb-6">Inscription</h2>
        )}
        
        <Link
          href="/register/form"
          className="block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-rouge-hover transition-colors text-center"
        >
          Créer un compte
        </Link>

        {showLoginLink && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline"
            >
              ← Retour à la connexion
            </button>
          </div>
        )}
      </div>
    );
  }

  // Version complète pour les pages dédiées
  return (
    <div className={`${className} ${!isInSidebar ? 'h-full p-2.5 pb-5 flex flex-col items-center font-geo gap-8 text-clrprincipal' : 'space-y-4'}`}>
      {!isInSidebar && <ReturnButton />}

      {showTitle && (
        <p className={`${isInSidebar ? 'text-2xl' : 'text-3xl'} font-bold text-primary mb-6 ${
          !isInSidebar ? 'text-center after:content-[\'\'] after:block after:w-full after:h-1 after:bg-primary after:rounded after:mt-8' : ''
        }`}>
          {isInSidebar ? 'Créer un compte' : 'Bienvenue à bord 👋'}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${isInSidebar ? 'space-y-4' : 'flex flex-col justify-start items-center gap-5'}`}
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

        {/* Champs du formulaire */}
        <div className={`w-full flex flex-col justify-start items-start ${isInSidebar ? 'space-y-4' : 'gap-5'}`}>
          {/* Pseudo */}
          <div className={`${isInSidebar ? 'w-full' : 'flex w-full justify-between items-center gap-5'}`}>
            <div className={`${isInSidebar ? 'mb-1' : 'flex flex-col'}`}>
              <p className={`text-clrprincipal ${isInSidebar ? 'text-sm' : 'text-sm'} font-bold`}>
                {isInSidebar ? 'Nom d\'utilisateur' : 'Pseudonyme*'}
              </p>
              {!isInSidebar && (
                <p className="text-zinc-500 text-xs font-light">
                  *doit être unique
                </p>
              )}
            </div>
            <input
              type="text"
              name="username"
              placeholder={isInSidebar ? "Votre nom d'utilisateur" : "MartinJean05"}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${isInSidebar ? 'w-full px-3 py-2 bg-clrsecondaire border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-clrprincipal' : 'w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500'}`}
            />
          </div>

          {/* Prénom */}
          <div className={`${isInSidebar ? 'grid grid-cols-2 gap-4' : 'flex w-full justify-between items-center gap-5'}`}>
            <div>
              <p className={`${isInSidebar ? 'block text-sm font-medium text-clrprincipal mb-1' : 'justify-start text-clrprincipal font-bold text-sm'}`}>
                Prénom
              </p>
              <input
                type="text"
                name="firstName"
                placeholder="Jean"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`${isInSidebar ? 'w-full bg-clrsecondaire px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-clrprincipal' : 'w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500'}`}
              />
            </div>

            <div>
              <p className={`${isInSidebar ? 'block text-sm font-medium text-clrprincipal mb-1' : 'justify-start text-clrprincipal font-bold text-sm'}`}>
                Nom
              </p>
              <input
                type="text"
                name="lastName"
                placeholder="Martin"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`${isInSidebar ? 'w-full bg-clrsecondaire px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-clrprincipal' : 'w-full p-2 px-3 max-w-36 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500'}`}
              />
            </div>
          </div>

          {/* Email */}
          <div className={`${isInSidebar ? 'w-full' : 'self-stretch flex flex-col justify-start items-start gap-2.5'}`}>
            <p className={`${isInSidebar ? 'block text-sm font-medium text-clrprincipal mb-1' : 'justify-start text-clrprincipal font-bold text-sm'}`}>
              Email
            </p>
            <input
              type="email"
              name="email"
              placeholder={isInSidebar ? "votre@email.com" : "Exemple@mail.com"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${isInSidebar ? 'w-full bg-clrsecondaire px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-clrprincipal' : 'w-full p-2 px-3 text-xs rounded-lg bg-clrsecondaire text-clrprincipal font-light outline-none placeholder-zinc-500'}`}
            />
          </div>
        </div>
        
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
            className={`flex-1 text-center justify-center text-xl font-bold pointer-events-none ${
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

        {showLoginLink && (
          <div className="text-center flex justify-start items-center gap-2">
            <p className='text-sm text-gray-600'>Déjà un compte ?</p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline"
            >
               Se connecter
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
