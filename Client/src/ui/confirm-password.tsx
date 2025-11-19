'use client';

import React, { useState, useEffect } from 'react';
import { EyesIcon, EyesCloseIcon } from '@/libs/Icons';

interface ConfirmPasswordProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ConfirmPassword({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
  className = ""
}: ConfirmPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Critères de validation du mot de passe
  const passwordCriteria = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_\-\.]).+$/;

  // Fonctions pour gérer la visibilité des mots de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Vérification du mot de passe en temps réel
  useEffect(() => {
    if (password === "") {
      setPasswordInvalid(false);
      return;
    }
    setPasswordInvalid(!passwordCriteria.test(password));
  }, [password]);

  // Vérification de la correspondance des mots de passe
  useEffect(() => {
    if (password === "" || confirmPassword === "") {
      setPasswordMismatch(false);
      return;
    }
    setPasswordMismatch(password !== confirmPassword);
  }, [password, confirmPassword]);

  return (
    <div className={`self-stretch flex flex-col justify-start items-start gap-5 ${className}`}>
      {/* Mot de passe */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
        <div className="flex flex-col">
          <p className="text-clrprincipal text-sm font-bold block">
            Mot de passe
          </p>
          <p className={`text-zinc-500 text-xs font-light ${!passwordInvalid ? 'hidden' : ''}`}>
            Votre mot de passe doit contenir au moins : un chiffre, une
            majuscule et un caractère spécial.
          </p>
        </div>
        <div className="self-stretch p-2.5 bg-clrsecondaire rounded-[10px] flex justify-between items-center overflow-hidden border-primary border-2">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="**********"
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={disabled}
            className="flex-1 bg-transparent text-clrprincipal text-sm font-normal outline-none placeholder-zinc-500 disabled:opacity-50    "
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={
              showPassword
                ? "Cacher le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showPassword ? (
              <EyesCloseIcon className="text-zinc-500 hover:text-zinc-700" width={16} height={16} />
            ) : (
              <EyesIcon className="text-zinc-500 hover:text-zinc-700" width={16} height={16} />
            )}
          </button>
        </div>
      </div>

      {/* Confirmation du mot de passe */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
        <p className="text-clrprincipal text-sm font-bold block">
          Confirmer votre mot de passe
        </p>
        <p className={`text-dangerous-500 text-xs font-light ${!passwordMismatch ? 'hidden' : ''}`}>
          Vos mots de passe ne correspondent pas.
        </p>
        <div className="self-stretch p-2.5 bg-clrsecondaire rounded-[10px] flex justify-between items-center overflow-hidden border-primary border-2">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="**********"
            required
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={disabled}
            className="flex-1 bg-transparent text-clrprincipal text-sm font-normal outline-none placeholder-zinc-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            disabled={disabled}
            className="w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={
              showConfirmPassword
                ? "Cacher le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showConfirmPassword ? (
              <EyesCloseIcon className="text-zinc-500 hover:text-zinc-700" width={16} height={16} />
            ) : (
              <EyesIcon className="text-zinc-500 hover:text-zinc-700" width={16} height={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
