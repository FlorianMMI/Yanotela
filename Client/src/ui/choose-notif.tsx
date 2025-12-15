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
    <div className="w-full flex items-center gap-2 m-0">
      {/* Nom de la notification */}
      <div className="flex-1">
        <div className="text-black text-sm font-normal">
          {name}
        </div>
        {description && (
          <div className="text-[11px] text-gray-600 mt-0.5">
            {description}
          </div>
        )}
      </div>

      {/* Checkbox Par mail */}
      <div className="flex justify-center items-center">
        <label className="w-8 h-8 relative cursor-pointer">
          <input
            type="checkbox"
            checked={mailnotif}
            onChange={(e) => onMailNotifChange(id, e.target.checked)}
            className="absolute opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className={`w-8 h-5 absolute left-0 top-1.5 rounded-full transition-colors ${
              mailnotif ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 transition-transform ${
                mailnotif ? "translate-x-[14px]" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Checkbox Par l'app */}
      <div className="flex justify-center items-center">
        <label className="w-8 h-8 relative cursor-pointer">
          <input
            type="checkbox"
            checked={appnotif}
            onChange={(e) => onAppNotifChange(id, e.target.checked)}
            className="absolute opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className={`w-8 h-5 absolute left-0 top-1.5 rounded-full transition-colors ${
              appnotif ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-1/2 -translate-y-1/2 transition-transform ${
                appnotif ? "translate-x-[14px]" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
