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
      // Mode sauvegarde - vérifier que la valeur n'est pas vide
      const trimmedValue = currentValue.trim();
      if (trimmedValue === "") {
        // Restaurer la valeur par défaut si vide
        setCurrentValue(defaultValue);
        setIsEditing(false);
        return;
      }
      
      if (onSave && trimmedValue !== defaultValue) {
        onSave(trimmedValue);
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

  // Vérifier si il y a des modifications non sauvegardées et que la valeur n'est pas vide
  const hasUnsavedChanges = isEditing && currentValue.trim() !== defaultValue && currentValue.trim() !== "";
  const isValueEmpty = currentValue.trim() === "";
  const isSaveDisabled = isEditing && isValueEmpty;

  return (
    <div className='self-stretch flex flex-col gap-1'>
      <div className='flex justify-between items-center gap-3'>
        <div className="flex flex-col">
          <p className="justify-start text-clrprincipal w-fit font-bold text-base text-nowrap">
            {name}{type==="pseudo" ? "*" : " "}:
          </p>
          {type==="pseudo" ? <span className="text-gray-500 text-xs font-light text-start">*Doit être unique</span> : " "}
        </div>
        {
          type === "email" ?
          <p className="flex contain-content w-full md:w-1/2 px-3 py-3 md:py-2  rounded-lg text-clrprincipal  border-gray-300 cursor-not-allowed text-base md:text-sm">
            {
              defaultValue.length > 20 ?
              defaultValue.split('@')[0].slice(0, 2) + '...' + defaultValue.split('@')[0].slice(-2) + '@' + defaultValue.split('@')[1]
              :
              defaultValue
            }
          </p>
          :
          <div className={`flex gap-3 md:gap-4 w-full items-center justify-center max-w-[200px] flex-row`}>
            <input
              type={type}
              name={name}
              placeholder={placeholder}
              required
              value={currentValue}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-2 py-1 md:px-3 md:py-2 border-2 rounded-lg text-clrprincipal text-base md:text-sm transition-all duration-300 ${
                isEditing
                  ? `bg-clrsecondaire ${isValueEmpty ? "border-dangerous-500" : "border-primary"} focus:ring-2 focus:ring-primary focus:border-transparent`
                  : "bg-gray-200 border-gray-300  cursor-not-allowed"
              }`}
            />
            <button
              onClick={handleToggleEdit}
              disabled={isSaveDisabled}
              className={`cursor-pointer rounded-full items-center h-8 w-8 md:h-10 md:w-10 shrink-0 flex justify-center p-1 hover:shadow-md transition-all duration-300 ${
                  isSaveDisabled
                    ? "bg-gray-300 cursor-not-allowed opacity-50"
                    : isEditing 
                      ? hasUnsavedChanges 
                        ? "bg-success-700 hover:bg-success-600 animate-pulse" 
                        : "bg-gray-500 hover:bg-gray-400"
                      : "bg-primary hover:bg-primary-hover"
                }`}
              aria-label={isEditing ? "Sauvegarder" : `Modifier ${name || 'le champ'}`}
            >
              <Icons
                name={isEditing ? "save" : "modif"}
                size={20}
                className={`text-white`}
              />
            </button>
          </div>
        }
      </div>
      
      {/* Warning message when field is empty in edit mode */}
      {isEditing && isValueEmpty && type !== "email" && (
        <div className="flex items-center gap-1 text-dangerous-500 text-xs ml-auto max-w-[200px]">
          <Icons name="warning" size={12} />
          <span>Ce champ ne peut pas être vide</span>
        </div>
      )}
    </div>
  );
}
