"use client";

import React, { useState } from "react";
import Icons from "@/ui/Icon";
import { div } from "motion/react-client";

interface InputModifiedProps {
  name?: string;
  placeholder?: string;
  type?: "name" | "email" | "password" | "username" | "pseudo";
  defaultValue?: string;
  onSave?: (value: string) => void;
}

export default function InputModified({
  name,
  placeholder,
  type,
  defaultValue = "",
  onSave,
}: InputModifiedProps) {
  const [isEditing, setIsEditing] = useState(false);


  const handleToggleEdit = () => {
    if (isEditing) {
      // Mode sauvegarde
      
      setIsEditing(false);
    } else {
      // Mode édition
      setIsEditing(true);
    }
  };

  return (
    <div className='self-stretch flex flex-col justify-start items-start gap-2.5  border-b-2 pb-2 border-dashed last:border-b-0 '>
      <div className="flex flex-col gap-1">
      <p className="justify-start text-clrprincipal font-bold text-sm">
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
          value={defaultValue}
          onChange={(e) => {}}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border-2 rounded-lg text-clrprincipal transition-all duration-300 ${
            isEditing
              ? "bg-clrsecondaire border-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              : "bg-gray-200 border-gray-300  cursor-not-allowed"
          }`}
        />
        {type==="email" ?
        <div className="flex flex-col gap-1">
        <button className="w-full flex items-center justify-center space-x-3 py-2 px-4 bg-primary text-white border border-red-700 rounded-xl shadow-md hover:bg-red-700 hover:border-red-800 hover:text-white hover:shadow-lg transition-all cursor-pointer group">
          <p>Recevoir un mail de confirmation*</p>
          <Icons
            name="mail"
            size={20}
            className="text-white"
          />
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
              isEditing ? "bg-green-700 hover:bg-green-600" : "bg-primary hover:bg-primary-hover"
            }`}
          />
        </button>}
      </div>
    </div>
  );
}
