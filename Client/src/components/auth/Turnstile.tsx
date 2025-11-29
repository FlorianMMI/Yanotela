"use client";

import { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
  siteKey?: string;
  className?: string;
  aspectRatio?: string; // e.g. '5/1' or '16/9'
}

// Déclaration globale pour éviter les erreurs TS
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    __turnstileOnLoad?: () => void;
  }
}

export default function Turnstile({ siteKey, className = '', aspectRatio = '5/1' }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const getKey = useCallback(() => {
    return siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  }, [siteKey]);

  // Fonction pour créer/récupérer l'input caché du token
  const ensureTokenInput = useCallback(() => {
    if (typeof document === 'undefined') return null;
    let input = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      input.value = '';
      document.body.appendChild(input);
    }
    return input;
  }, []);

  // Fonction de rendu du widget
  const renderWidget = useCallback(() => {
    const key = getKey();
    if (!key || typeof window === 'undefined' || !window.turnstile) return;

    const el = containerRef.current;
    if (!el) return;

    // Éviter le double rendu
    if (el.dataset.turnstileRendered === '1' || widgetIdRef.current) return;

    // Si un iframe existe déjà, ne pas re-rendre
    if (el.querySelector('iframe')) {
      el.dataset.turnstileRendered = '1';
      return;
    }

    try {
      const tokenInput = ensureTokenInput();

      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: key,
        size: 'flexible', // S'adapte à la largeur du conteneur
        appearance: 'interaction-only', // Ne s'affiche que si interaction nécessaire (mode "invisible-like")
        callback: (token: string) => {
          if (tokenInput) tokenInput.value = token || '';
        },
        'expired-callback': () => {
          if (tokenInput) tokenInput.value = '';
        },
        'error-callback': () => {
          // Silencieux - ne pas logger d'erreur pour éviter le bruit console
          if (tokenInput) tokenInput.value = '';
        },
      });

      el.dataset.turnstileRendered = '1';

      // Ajuster le style de l'iframe après le rendu
      requestAnimationFrame(() => {
        const iframe = el.querySelector('iframe') as HTMLIFrameElement | null;
        if (iframe) {
          iframe.style.position = 'absolute';
          iframe.style.inset = '0';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.maxWidth = '100%';
          iframe.style.boxSizing = 'border-box';
          iframe.style.border = '0';
        }
      });
    } catch {
      // Silencieux - Turnstile peut échouer sans impact fonctionnel
    }
  }, [getKey, ensureTokenInput]);

  // Charger le script Turnstile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = getKey();
    if (!key) return;

    // Si le script est déjà chargé
    if (window.turnstile) {
      scriptLoadedRef.current = true;
      renderWidget();
      return;
    }

    // Vérifier si le script est en cours de chargement
    const existingScript = document.getElementById('cf-turnstile-script');
    if (existingScript) {
      // Attendre que le script soit chargé
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkLoaded);
          scriptLoadedRef.current = true;
          renderWidget();
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // Créer et charger le script (sans preload pour éviter l'avertissement)
    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    // render=explicit évite le rendu automatique, onload callback pour savoir quand c'est prêt
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__turnstileOnLoad';
    script.async = true;
    script.defer = true; // defer pour ne pas bloquer le parsing

    // Callback global pour le chargement
    window.__turnstileOnLoad = () => {
      scriptLoadedRef.current = true;
      renderWidget();
    };

    script.onerror = () => {
      // Silencieux - le script peut échouer si bloqué par un adblocker
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup du callback global
      delete window.__turnstileOnLoad;
    };
  }, [getKey, renderWidget]);

  // Effet pour tenter le rendu quand le script est chargé
  useEffect(() => {
    if (scriptLoadedRef.current && window.turnstile) {
      renderWidget();
    }
  }, [renderWidget]);

  // Cleanup du widget au démontage
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Silencieux
        }
        widgetIdRef.current = null;
      }
      // Reset le flag de rendu
      if (containerRef.current) {
        containerRef.current.dataset.turnstileRendered = '';
      }
    };
  }, []);

  const key = getKey();
  if (!key) {
    // Pas de clé = pas de widget (environnement de dev)
    return null;
  }

  return (
    <div className={`${className} mb-3`}>
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio }}
      >
        <div
          ref={containerRef}
          className="cf-turnstile absolute inset-0 w-full h-full"
          data-sitekey={key}
        />
      </div>
    </div>
  );
}
