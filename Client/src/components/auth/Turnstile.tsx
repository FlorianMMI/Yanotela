"use client";

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey?: string;
  className?: string;
}

export default function Turnstile({ siteKey, className = '' }: TurnstileProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = siteKey || (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined);
    if (!key) return;

    // inject the script only once
    if (!document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      document.head.appendChild(s);
    }
  }, [siteKey]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = siteKey || (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined);
    if (!key) return;

    const renderWidget = () => {
      try {
        const el = containerRef.current;
        if (!el) return;
        // If the Cloudflare turnstile lib is available, explicitly render this widget
        const anyWin = window as any;
        if (anyWin.turnstile && typeof anyWin.turnstile.render === 'function') {
          // render expects the element (or selector) and options
          anyWin.turnstile.render(el, { sitekey: key });
        } else if (anyWin.turnstile && typeof anyWin.turnstile.renderAll === 'function') {
          anyWin.turnstile.renderAll();
        }
      } catch (err) {
        // don't crash the app if turnstile fails
        // eslint-disable-next-line no-console
        console.error('Turnstile render error:', err);
      }
    };

    // If script already loaded, render immediately
    const anyWin = window as any;
    if (anyWin.turnstile) {
      renderWidget();
      return;
    }

    // Otherwise, wait for the script to load and then render
    const script = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
    if (script) {
      if (script.hasAttribute('data-loaded')) {
        renderWidget();
      } else {
        const onLoad = () => {
          script.setAttribute('data-loaded', '1');
          renderWidget();
        };
        script.addEventListener('load', onLoad);
        return () => script.removeEventListener('load', onLoad);
      }
    }
  }, [siteKey]);

  // Render placeholder div where Turnstile will render the widget
  return (
    <div className={className}>
      <div ref={containerRef} className="cf-turnstile" data-sitekey={siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </div>
  );
}
