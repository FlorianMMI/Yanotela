"use client";

import React, { useState } from 'react';
import Icon from '@/ui/Icon';

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
  className?: string;
  isFullWidth?: boolean;
}

/**
 * Composant réutilisable pour l'authentification Google
 * Supporte à la fois le login et le register - le serveur gère automatiquement
 */
export default function GoogleAuthButton({
  mode,
  onSuccess,
  className = "",
  isFullWidth = true
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // L'API serveur redirige automatiquement vers Google OAuth
      // puis gère l'inscription ou la connexion selon que l'utilisateur existe
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Redirection directe vers la route Google OAuth du serveur
      window.location.href = `${baseUrl}/auth/google`;
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
      setIsLoading(false);
    }
  };

  const buttonText = mode === 'login' 
    ? "Se connecter avec Google" 
    : "S'inscrire avec Google";

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`
        ${isFullWidth ? 'w-full' : ''} 
        p-2.5 bg-white rounded-lg 
        flex items-center gap-3 
        hover:bg-gray-200 active:bg-gray-50 
        disabled:bg-gray-100 disabled:cursor-not-allowed
        transition-colors cursor-pointer 
        justify-center
        ${mode === 'login' ? 'border border-gray-300' : ''}
        ${className}
      `}
    >
      <Icon 
        name="google" 
        className={isLoading ? "text-gris-100" : "text-primary"} 
        size={20} 
      />
      <span className={`text-sm font-medium font-['Gantari'] ${
        isLoading ? 'text-gris-100' : mode === 'login' ? 'text-black' : 'text-gray-700'
      }`}>
        {isLoading ? 'Connexion en cours...' : buttonText}
      </span>
    </button>
  );
}
