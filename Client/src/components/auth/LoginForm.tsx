"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import { Login } from '@/loader/loader';

interface LoginFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  showRegisterLink?: boolean;
  showForgotLink?: boolean;
  onSwitchToRegister?: () => void;
  onSwitchToForgot?: () => void;
  className?: string;
  isInSidebar?: boolean; // Pour adapter le style selon le contexte
}

export default function LoginForm({
  onSuccess,
  showTitle = true,
  showRegisterLink = true,
  showForgotLink = true,
  onSwitchToRegister,
  onSwitchToForgot,
  className = "",
  isInSidebar = false
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const loginData = {
      identifiant: formData.get('identifiant') as string,
      password: formData.get('password') as string,
    };

    try {
      const result = await Login(loginData);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/notes');
          router.refresh();
        }
      } else {
        setError(result.error || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={className}>
      {showTitle && (
        <p className={`${isInSidebar ? 'text-xl' : 'text-3xl'} font-bold text-primary mb-6 ${
          !isInSidebar ? 'text-center after:content-[\'\'] after:block after:w-full after:h-1 after:bg-primary after:rounded after:mt-8' : ''
        }`}>
          {isInSidebar ? 'Connexion' : 'Quel plaisir de vous revoir !'}
        </p>
      )}

      <form onSubmit={handleSubmit} id="login-form" className="w-full flex flex-col justify-center items-start gap-2.5">
        {error && (
          <div className="w-full p-2.5 bg-red-100 border-red-400 text-red-700 rounded-[10px] text-sm">
            {error}
          </div>
        )}
        
        {!isInSidebar && (
          <p className="justify-center text-clrprincipal text-sm font-normal font-gant">
            Veuillez indiquer votre adresse e-mail et votre mot de passe.
          </p>
        )}
        
        <div data-property-1="Mail" className="w-full p-2.5 bg-clrsecondaire rounded-[10px] flex justify-start items-center gap-2.5">
          <Icon name="at" className="text-zinc-500" size={20} />
          <input 
            type="text" 
            name="identifiant"
            id="identifiant"
            placeholder="Votre mail ou pseudonyme"
            required
            className="flex-1 bg-transparent text-clrprincipal text-sm font-normal font-gant outline-none"
          />
        </div>
        
        <div data-property-1="MDP" className="w-full p-2.5 bg-clrsecondaire rounded-[10px] flex justify-between items-center">
          <div className="flex justify-center items-center gap-2.5">
            <Icon name="keyhole" className="text-zinc-500" size={20} />
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Votre mot de passe"
              required
              className="flex-1 bg-transparent text-clrprincipal text-sm font-normal font-gant outline-none"
            />
          </div>
          <button 
            type="button"
            onClick={togglePasswordVisibility}
            className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
          >
            <Icon 
              name={showPassword ? "eye-close" : "eye"} 
              className="text-zinc-500 hover:text-zinc-700" 
              size={16} 
            />
          </button>
        </div>
        
        {showForgotLink && (
          <button 
            type="button"
            onClick={onSwitchToForgot || (() => router.push('/forgot-password'))}
            className="w-full justify-start text-start flex text-primary hover:text-primary-hover hover:underline text-sm font-normal font-gant cursor-pointer"
          >
            Mot de passe oublié ?
          </button>
        )}
      
        <button 
          type="submit" 
          disabled={isLoading}
          className="p-2.5 w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 rounded-[10px] flex justify-between items-center shadow-md cursor-pointer transition-colors"
        >
          <p className="flex-1 text-center justify-center text-white text-xl font-bold font-gant pointer-events-none">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </p>
          <Icon name="arrow-barre" className="text-white pointer-events-none" size={40} />
        </button>

        {/* Séparateur et connexion Google - seulement sur page complète */}
        {!isInSidebar && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center w-full gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <p className="text-gray-500 text-sm font-normal font-gant">ou</p>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            
            <button 
              type="button" 
              className="w-full p-2.5 bg-white border border-gray-300 rounded-[10px] flex justify-center items-center gap-3 hover:bg-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <Icon name="google" className="text-primary" size={20} />
              <span className="text-gray-700 text-sm font-medium font-gant">
                Se connecter avec Google
              </span>
            </button>
          </div>
        )}

        {/* Lien d'inscription */}
        {showRegisterLink && (
          <div className={`${isInSidebar ? 'text-center mt-4' : 'text-center'}`}>
            <div className="text-sm text-gray-600">
              {isInSidebar ? 'Pas de compte ?' : 'Vous n\'avez pas de Compte ?'}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister || (() => router.push('/register'))}
                className="text-primary hover:underline"
              >
                {isInSidebar ? 'S\'inscrire' : 'Inscrivez-vous'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}