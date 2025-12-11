"use client";

import React from "react";

interface NotificationRowProps {
  id: string;
  name: string;
  description?: string;
  appnotif: boolean;
  mailnotif: boolean;
  onAppNotifChange: (id: string, value: boolean) => void;
  onMailNotifChange: (id: string, value: boolean) => void;
}

export function NotificationRow({
  id,
  name,
  description,
  appnotif,
  mailnotif,
  onAppNotifChange,
  onMailNotifChange,
}: NotificationRowProps) {
  return (
    <div className="w-full flex items-center gap-4">
      {/* Nom de la notification */}
      <div className="flex-1">
        <div className="text-black text-xl font-normal">
          {name}
        </div>
        {description && (
          <div className="text-sm text-gray-600 mt-1">
            {description}
          </div>
        )}
      </div>

      {/* Checkbox Par mail */}
      <div className="flex justify-center items-center">
        <label className="w-12 h-12 relative cursor-pointer">
          <input
            type="checkbox"
            checked={mailnotif}
            onChange={(e) => onMailNotifChange(id, e.target.checked)}
            className="absolute opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className={`w-12 h-7 absolute left-0 top-[10.50px] rounded-full transition-colors ${
              mailnotif ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                mailnotif ? "translate-x-[26px]" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Checkbox Par l'app */}
      <div className="flex justify-center items-center">
        <label className="w-12 h-12 relative cursor-pointer">
          <input
            type="checkbox"
            checked={appnotif}
            onChange={(e) => onAppNotifChange(id, e.target.checked)}
            className="absolute opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className={`w-12 h-7 absolute left-0 top-[10.50px] rounded-full transition-colors ${
              appnotif ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                appnotif ? "translate-x-[26px]" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
