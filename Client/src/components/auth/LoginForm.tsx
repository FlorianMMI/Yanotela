"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import { Login } from '@/loader/loader';
import GoogleAuthButton from './GoogleAuthButton';

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
      error: null as string | null,
      errors: [] as Array<{ msg: string }>
    };
    
    try {
      const result = await Login(loginData);
      
      if (result.success) {
        // Vérifier s'il y a une redirection enregistrée
        const redirectAfterLogin = localStorage.getItem('yanotela:redirect-after-login');
        
        if (redirectAfterLogin) {
          localStorage.removeItem('yanotela:redirect-after-login');
          router.push(redirectAfterLogin);
        } else if (onSuccess) {
          onSuccess();
        } else {
          router.push('/notes');
        }
      } else {
        setError(result.error || 'Identifiants incorrects');
      }
    } catch (error) {
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

      <form role="form" onSubmit={handleSubmit} id="login-form" className="w-full flex flex-col justify-center items-start gap-2.5">
        {error && (
          <div className="w-full p-2.5 bg-dangerous-100 border-dangerous-600 text-dangerous-600 rounded-[10px] text-sm">
            {error}
          </div>
        )}
        
        {!isInSidebar && (
          <p className="justify-center text-clrprincipal text-sm font-normal font-gant">
            Veuillez indiquer votre adresse e-mail et votre mot de passe.
          </p>
        )}
        
        <div data-property-1="Mail" className="w-full border-primary border-2 p-2.5 bg-clrsecondaire rounded-[10px] flex justify-start items-center gap-2.5">
          <Icon name="at" className="text-gris-100" size={20} />
          <input 
            type="text" 
            name="identifiant"
            id="identifiant"
            placeholder="Votre mail ou pseudonyme"
            required
            className="flex-1 bg-transparent text-clrprincipal text-sm font-normal font-gant outline-none"
          />
        </div>

        <div data-property-1="MDP" className="w-full p-2.5 bg-clrsecondaire border-primary border-2 rounded-[10px] flex justify-between items-center">

          <div className="flex justify-center items-center gap-2.5">
            <Icon name="keyhole" className="text-gris-100" size={20} />
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
              className="text-gris-100 hover:text-gris-700" 
              size={16} 
            />
          </button>
        </div>
        
        {showForgotLink && (
          <button 
            type="button"
            onClick={onSwitchToForgot || (() => router.push('/forgot-password'))}

            className="w-full justify-start text-start flex text-dangerous-100 hover:text-primary-hover hover:underline text-sm font-normal font-gant cursor-pointer"
          >
            Mot de passe oublié ?
          </button>
        )}
      
        <button 
          type="submit" 
          disabled={isLoading}
          className="p-2.5 w-full bg-primary hover:bg-primary-hover disabled:bg-gris-100 rounded-[10px] flex justify-between items-center shadow-md cursor-pointer transition-colors"
        >
          <p className="flex-1 text-center justify-center text-white text-xl font-bold font-gant pointer-events-none">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </p>
          <Icon name="arrow-barre" className="text-white pointer-events-none" size={40} />
        </button>

        {/* Séparateur et connexion Google */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center w-full gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="text-gris-100 text-sm font-normal font-gant">ou</p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          
          <GoogleAuthButton 
            mode="login"
            onSuccess={onSuccess}
          />
        </div>

        {/* Lien d'inscription */}
        {showRegisterLink && (
          <div className={`${isInSidebar ? 'text-center mt-4' : 'text-center'}`}>
            <div className="text-sm text-clrprincipal">
              {isInSidebar ? 'Pas de compte ?' : 'Vous n\'avez pas de Compte ?'}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister || (() => router.push('/register'))}

                className="text-dangerous-100 hover:underline"

              >
                Inscrivez-vous
              </button>
            </div>
          </div>
        )}
        
      </form>
    </div>
  );
}
