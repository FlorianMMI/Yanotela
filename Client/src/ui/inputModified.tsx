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
    <div className='self-stretch flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-2.5 border-b-2 pb-3 md:pb-2 border-dashed last:border-b-0'>
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <p className="justify-start text-clrprincipal w-fit font-bold text-base md:text-sm">
          {name}{type==="pseudo" ? "*" : " "}:
        </p>
        {type==="pseudo" ? <span className="text-zinc-500 text-xs font-light text-start">*Doit être unique</span> : " "}
      </div>
      {
        type === "email" ?
        <p className="w-full md:w-1/2 px-3 py-3 md:py-2 border-2 rounded-lg text-clrprincipal bg-gray-200 border-gray-300 cursor-not-allowed text-base md:text-sm">
          {
            defaultValue.length > 20 ?
            defaultValue.split('@')[0].slice(0, 2) + '...' + defaultValue.split('@')[0].slice(-2) + '@' + defaultValue.split('@')[1]
            :
            defaultValue
          }
        </p>
        :          
        <div className={`flex gap-3 md:gap-4 w-full md:w-1/2 flex-row`}>
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            required
            value={currentValue}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`w-full px-4 py-3 md:px-3 md:py-2 border-2 rounded-lg text-clrprincipal text-base md:text-sm transition-all duration-300 ${
              isEditing
                ? "bg-clrsecondaire border-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                : "bg-gray-200 border-gray-300  cursor-not-allowed"
            }`}
          />
          <button
            onClick={handleToggleEdit}
            className="flex items-center justify-center flex-shrink-0"
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
          </button>
        </div>
      }
      
    </div>
  );
}
