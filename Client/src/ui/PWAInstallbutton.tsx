'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détecter l'installation réussie
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowModal(true);
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  // Si déjà installé
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#E9EBDB] text-primary rounded-lg border-2 border-primary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-gantari font-semibold">Application installée</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex w-full items-center justify-center gap-2 px-6 py-3 bg-primary text-[#E9EBDB] font-gantari font-semibold rounded-sm hover:bg-primary-hover active:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mt-8"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{isInstalling ? 'Installation...' : 'Installer Yanotela'}</span>
      </button>

      {/* Modal d'instructions manuelles */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#E9EBDB] rounded-lg shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-primary hover:bg-primary/10 rounded p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-gantari text-2xl font-bold text-primary mb-4">
              Installer Yanotela
            </h3>

            <div className="space-y-4 font-geologica text-gray-700">
              <div>
                <h4 className="font-semibold text-primary mb-2">Sur mobile (Chrome/Edge Android)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Appuyez sur le menu ⋮ (trois points)</li>
                  <li>Sélectionnez "Ajouter à l'écran d'accueil"</li>
                  <li>Confirmez l'installation</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-2">Sur PC (Chrome/Edge)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Cliquez sur l'icône ⊕ ou ⋮ dans la barre d'adresse</li>
                  <li>Ou Menu → "Installer Yanotela"</li>
                  <li>Confirmez l'installation</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-primary mb-2">Sur iPhone/iPad (Safari)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Appuyez sur le bouton Partager</li>
                  <li>Sélectionnez "Sur l'écran d'accueil"</li>
                  <li>Confirmez l'ajout</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-2 bg-primary text-[#E9EBDB] font-gantari font-semibold rounded hover:bg-primary-hover transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}