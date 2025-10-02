"use client";

import React, { useState, useEffect } from "react";
import Icons from "@/ui/Icon";

interface InputModifiedProps {
  name?: string;
  placeholder?: string;
  type?: "name" | "email" | "password" | "username" | "pseudo";
  defaultValue?: string;
  onSave?: (value: string) => void;
  onEmailConfirmation?: () => void;
  isLoading?: boolean;
}

export default function InputModified({
  name,
  placeholder,
  type,
  defaultValue = "",
  onSave,
  onEmailConfirmation,
  isLoading = false,
}: InputModifiedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(defaultValue);

  // Mettre à jour la valeur locale quand defaultValue change
  useEffect(() => {
    setCurrentValue(defaultValue);
  }, [defaultValue]);

  const handleToggleEdit = () => {
    if (isEditing) {
      // Mode sauvegarde
      if (onSave && currentValue !== defaultValue) {
        onSave(currentValue);
      }
      setIsEditing(false);
    } else {
      // Mode édition
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  // Vérifier si il y a des modifications non sauvegardées
  const hasUnsavedChanges = isEditing && currentValue !== defaultValue;

  return (
    <div className='self-stretch flex flex-col md:flex-row justify-start items-start gap-2.5  border-b-2 pb-2 border-dashed last:border-b-0 '>
      <div className="flex flex-col gap-1 w-full">
      <p className="justify-start text-clrprincipal w-fit font-bold text-sm">
        {name}{type==="pseudo" ? "*" : " "}:
      </p>
      {type==="pseudo" ? <span className="text-zinc-500 text-xs font-light">*Doit être unique</span> : " "}
      </div>
      <div className={`flex  gap-4 w-full ${type==="email" ? "flex-col" : "flex-row"}`}>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required
          value={currentValue}
          onChange={handleInputChange}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border-2 rounded-lg text-clrprincipal transition-all duration-300 ${
            isEditing
              ? "bg-clrsecondaire border-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              : "bg-gray-200 border-gray-300  cursor-not-allowed"
          }`}
        />
        {type==="email" ?
        <div className="flex flex-col gap-1">
        <button 
          onClick={onEmailConfirmation}
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Envoi en cours...
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Recevoir un mail de confirmation*</span>
              <Icons
                name="mail"
                size={20}
                className="text-white"
              />
            </div>
          )}
        </button>
        <p className="text-xs text-gray-500">*Votre nouvelle adresse e-mail sera validée une fois que vous aurez cliqué sur le lien de confirmation qui vous sera envoyé.</p>
        </div>
        : <button
          onClick={handleToggleEdit}
          className="flex items-center justify-center"
          aria-label={isEditing ? "Sauvegarder" : `Modifier ${name || 'le champ'}`}
        >
          <Icons
            name={isEditing ? "save" : "modif"}
            size={30}
            className={`cursor-pointer rounded-full p-2 text-white hover:shadow-md transition-all duration-300 ${
              isEditing 
                ? hasUnsavedChanges 
                  ? "bg-green-700 hover:bg-green-600 animate-pulse" 
                  : "bg-gray-500 hover:bg-gray-400"
                : "bg-primary hover:bg-primary-hover"
            }`}
          />
        </button>}
      </div>
    </div>
  );
}
