"use client";
import React from "react";
import { useTheme, ThemeType } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "motion/react";
import Icons from "@/ui/Icon";

interface ThemeSelectorProps {
  className?: string;
}

export default function ThemeSelector({ className = "" }: ThemeSelectorProps) {
  const { currentTheme, themes, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const getThemeIcon = (themeId: ThemeType): React.ReactNode => {
    switch (themeId) {
      case "light":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case "dark":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        );
      case "blue":
        return (
          <div className="w-5 h-5 rounded-full bg-info-600 border-2 border-current"></div>
        );
      case "green":
        return (
          <div className="w-5 h-5 rounded-full bg-success-600 border-2 border-current"></div>
        );
      case "purple":
        return (
          <div className="w-5 h-5 rounded-full bg-purple-600 border-2 border-current"></div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative flex gap-2 items-center ${className}`}>
        <p className="">Thème: </p>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-1/3 items-center gap-2 px-4 py-2 rounded-lg bg-clrsecondaire hover:bg-beige-foncer transition-colors duration-200 border border-gray-300 shadow-sm"
        title="Changer de thème"
      >
        <div className="flex items-center justify-center">
          {getThemeIcon(currentTheme)}
        </div>
        <span className="text-sm font-medium text-clrprincipal hidden md:inline">
          Thème
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="w-4 h-4 text-clrprincipal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      {/* Menu déroulant */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay pour fermer le menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 bottom-0 mt-2 w-56 bg-clrsecondaire rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Choisir un thème
                </div>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      changeTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                      currentTheme === theme.id
                        ? "bg-primary text-white shadow-md"
                        : "hover:bg-gray-100 text-clrprincipal"
                    }`}
                  >
                    <div className="flex items-center justify-center w-6">
                      {getThemeIcon(theme.id)}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium">
                      {theme.name}
                    </span>
                    {currentTheme === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              {/* Aperçu du thème */}
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="text-xs text-gray-600 mb-2 font-medium">
                  Aperçu
                </div>
                <div className="flex gap-2">
                  {["background", "deskbackground", "primary", "foreground"].map(
                    (colorKey) => {
                      const color =
                        themes.find((t) => t.id === currentTheme)?.colors[
                          colorKey as keyof typeof themes[0]["colors"]
                        ];
                      return (
                        <div
                          key={colorKey}
                          className="flex-1 h-8 rounded border border-gray-300 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={colorKey}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
