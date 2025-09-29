"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import ReturnButton from '@/ui/returnButton';
import ConfirmPassword from '@/ui/confirm-password';
import { Register } from '@/loader/loader';
import FormField from '@/ui/form/FormField';
import FormMessage from '@/ui/form/FormMessage';

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

    // Vérification que les mots de passe correspondent (seulement si pas dans la sidebar)
    if (!isInSidebar && password !== confirmPassword) {
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
    if (isInSidebar) {
      // Pour la sidebar, pas besoin de confirmPassword
      if (username && email && firstName && lastName && password) {
        setIsFormValid(true);
      } else {
        setIsFormValid(false);
      }
    } else {
      // Pour la page complète, avec confirmPassword
      if (username && email && firstName && lastName && password && confirmPassword) {
        setIsFormValid(true);
      } else {
        setIsFormValid(false);
      }
    }
  }, [
    username,
    email,
    firstName,
    lastName,
    password,
    confirmPassword,
    isInSidebar,
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
        <FormMessage type="error" message={error} />
        <FormMessage type="success" message={success} />

        {/* Champs du formulaire */}
        <div className={`w-full flex flex-col justify-start items-start ${isInSidebar ? 'space-y-4' : 'gap-5'}`}>
          <FormField
            label={isInSidebar ? "Nom d'utilisateur" : "Pseudonyme*"}
            name="username"
            placeholder={isInSidebar ? "Votre nom d'utilisateur" : "MartinJean05"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            isInSidebar={isInSidebar}
          />

          <div className={`${isInSidebar ? 'grid grid-cols-2 gap-4' : 'flex w-full justify-between items-center gap-5'}`}>
            <FormField
              label="Prénom"
              name="firstName"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              isInSidebar={isInSidebar}
            />
            <FormField
              label="Nom"
              name="lastName"
              placeholder="Martin"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              isInSidebar={isInSidebar}
            />
          </div>

          <FormField
            label="Email"
            name="email"
            placeholder={isInSidebar ? "votre@email.com" : "Exemple@mail.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            isInSidebar={isInSidebar}
          />
        </div>

        {/* Mot de passe et confirmation */}
        {isInSidebar ? (
          <FormField
            label="Mot de passe"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            isInSidebar={isInSidebar}
          />
        ) : (
          <ConfirmPassword
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            disabled={isLoading}
          />
        )}

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
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline hover:text-primary-hover transition-all cursor-pointer"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        )}
      </form>
    </div>
  );
}