"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { CreateNote, SaveNote } from '@/loader/loader';
import { useAuth } from '@/hooks/useAuth';
import { InfoIcon, SaveIcon } from '@/libs/Icons';

interface SaveFlashNoteButtonProps {
  className?: string;
  variant?: 'default' | 'mobile';
  disabled?: boolean;
  currentTitle?: string; // Pour récupérer le titre actuel depuis Flash Note
}

export default function SaveFlashNoteButton({ 
  className = '', 
  variant = 'default'
}: SaveFlashNoteButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setFlashContent] = useState<string>('');
  const [flashEmpty, setFlashEmpty] = useState<boolean>(true);

  // Note: flash emptiness is tracked in state `flashEmpty` to avoid reading localStorage during render

  // Compute if flash content is empty
  const computeIsEmpty = (flashContentValue: string) => {
    if (!flashContentValue) return true;

    type LexicalNode = {
      children?: LexicalNode[];
      text?: string;
      [key: string]: unknown;
    };

    const hasNonEmptyText = (node: unknown): boolean => {
      if (!node || typeof node !== 'object') return false;
      const n = node as LexicalNode;
      if (typeof n.text === 'string' && n.text.trim().length > 0) return true;
      if (Array.isArray(n.children)) {
        return n.children.some((c) => hasNonEmptyText(c));
      }
      return false;
    };

    try {
      const content = JSON.parse(flashContentValue);
      if (!content || typeof content !== 'object') return true;
      const root = (content as { root?: { children?: unknown[] } }).root;
      if (!root || !Array.isArray(root.children) || root.children.length === 0) {
        return true;
      }
      const hasContent = root.children.some((child) => hasNonEmptyText(child));
      return !hasContent;
    } catch {
      return flashContentValue.trim().length === 0;
    }
  };

  // Initialize flash content from localStorage and subscribe to updates
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const FLASH_NOTE_CONTENT_KEY = 'yanotela:flashnote:content';

    // Read initial value on mount
    const readStored = () => {
      try {
        const stored = localStorage.getItem(FLASH_NOTE_CONTENT_KEY) || '';
        setFlashContent(stored);
        setFlashEmpty(computeIsEmpty(stored));
      } catch (e) {
        setFlashContent('');
        setFlashEmpty(true);
        void e;
      }
    };

    readStored();

    // Cross-tab updates (storage event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === FLASH_NOTE_CONTENT_KEY) {
        const newVal = e.newValue || '';
        setFlashContent(newVal);
        setFlashEmpty(computeIsEmpty(newVal));
      }
    };

    // In-tab updates: listen for custom event dispatched by the editor
    const onCustom = (event: Event) => {
      try {
        const ce = event as CustomEvent<string>;
        const newVal = typeof ce.detail === 'string' ? ce.detail : (localStorage.getItem(FLASH_NOTE_CONTENT_KEY) || '');
        setFlashContent(newVal);
        setFlashEmpty(computeIsEmpty(newVal));
      } catch (err) {
        // fallback to reading localStorage
        const newVal = localStorage.getItem(FLASH_NOTE_CONTENT_KEY) || '';
        setFlashContent(newVal);
        setFlashEmpty(computeIsEmpty(newVal));
        void err;
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('yanotela:flashnote:updated', onCustom as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('yanotela:flashnote:updated', onCustom as EventListener);
    };
  }, []);

  // Fonction pour sauvegarder Flash Note comme note normale
  const handleSaveFlashNote = async () => {
    if (!saveTitle.trim()) {
      setError('Le titre ne peut pas être vide');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSaving(true);
    
    try {
      // Récupérer le contenu de Flash Note depuis localStorage
      const flashContent = localStorage.getItem("yanotela:flashnote:content") || '';
      
      // Créer une nouvelle note
      const result = await CreateNote();

      if (result.note && result.note.id) {
        // Mettre à jour la note avec le titre et contenu de Flash Note
        const updateSuccess = await SaveNote(result.note.id, {
          Titre: saveTitle.trim(),
          Content: flashContent
        });

        if (updateSuccess) {
          // Vider Flash Note localStorage
          localStorage.removeItem("yanotela:flashnote:title");
          localStorage.removeItem("yanotela:flashnote:content");
          
          setSuccess('Flash Note sauvegardée avec succès !');
          setTimeout(() => setSuccess(null), 3000);
          
          // Fermer le popup
          setShowSavePopup(false);
          setSaveTitle('');
          
          // Rediriger vers la nouvelle note
          router.push(`/notes`);
        } else {
          setError('Erreur lors de la sauvegarde du contenu');
          setTimeout(() => setError(null), 5000);
        }
      } else {
        setError('Erreur lors de la création de la note');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      
      setError('Erreur lors de la sauvegarde');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPopup = () => {
    // Vérifier d'abord si l'utilisateur est connecté
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Récupérer le titre le plus récent depuis localStorage
    const currentStoredTitle = localStorage.getItem("yanotela:flashnote:title") || '';
    
    // Pré-remplir avec le titre actuel si disponible et différent de "Flash:"
    const defaultTitle = currentStoredTitle && currentStoredTitle !== 'Flash:' ? currentStoredTitle : '';
    setSaveTitle(defaultTitle);
    setShowSavePopup(true);
  };

  const buttonContent = (
    <>
      <SaveIcon 
        width={variant === 'mobile' ? 20 : 16} 
        height={variant === 'mobile' ? 20 : 16} 
        className={variant === 'mobile' ? "text-primary" : "text-white"} 
      />
      <span className={`${variant === 'mobile' ? 'text-base text-primary' : 'text-sm text-white'} font-medium`}>
        Enregistrer de façon permanente
      </span>
    </>
  );

  const buttonClasses = variant === 'mobile' 
    ? `flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg ${className}`
    : `flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors ${className}`;

  return (
    <>
      {/* Zone de notifications */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-md pl-4">
          {success && (
            <div 
              onClick={() => setSuccess(null)}
              className="rounded-md bg-success-50 p-4 border border-success-200 cursor-pointer hover:bg-success-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-green" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-success-800">
                    {success}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-green hover:text-success-800">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div 
              onClick={() => setError(null)}
              className="rounded-md bg-dangerous-50 p-4 border border-dangerous-600 cursor-pointer hover:bg-dangerous-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-dangerous-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-dangerous-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-dangerous-600 hover:text-dangerous-800">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popup de connexion requise */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-[#00000050] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <InfoIcon width={24} height={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Connexion requise
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              Pour sauvegarder votre Flash Note comme une note permanente, vous devez être connecté.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Sauvegarder l'intention de revenir à Flash Note après connexion
                  localStorage.setItem('yanotela:redirect-after-login', '/flashnote');
                  router.push('/login');
                  setShowLoginPrompt(false);
                }}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Se connecter
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('yanotela:redirect-after-login', '/flashnote');
                  router.push('/register');
                  setShowLoginPrompt(false);
                }}
                className="w-full px-4 py-2.5 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
              >
                Créer un compte
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Continuer sans sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de sauvegarde Flash Note */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-[#00000050] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sauvegarder Flash Note
            </h3>
            <p className="text-gray-600 mb-4">
              Donnez un titre à votre Flash Note pour la sauvegarder comme note normale :
            </p>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Titre de la note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4 text-gray-800 placeholder-gray-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSaving) {
                  handleSaveFlashNote();
                }
                if (e.key === 'Escape') {
                  setShowSavePopup(false);
                  setSaveTitle('');
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSavePopup(false);
                  setSaveTitle('');
                }}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFlashNote}
                disabled={isSaving || !saveTitle.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de sauvegarde */}
      <button
        onClick={handleOpenPopup}
        disabled={flashEmpty}
        className={`${buttonClasses} ${flashEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={flashEmpty ? "Votre Flash Note est vide" : "Sauvegarder comme une note"}
      >
        {buttonContent}
      </button>
    </>
  );
}
