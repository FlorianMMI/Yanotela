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
        // Prevent duplicate widget: if an iframe is already present, skip rendering
        if (el.querySelector('iframe')) {
          // apply small scale to existing iframe
          const existing = el.querySelector('iframe') as HTMLIFrameElement | null;
          if (existing) {
            existing.style.transform = 'scale(0.85)';
            existing.style.transformOrigin = 'left top';
            // adjust container height to match scaled iframe
            setTimeout(() => {
              try {
                if (existing && el) el.style.height = `${existing.offsetHeight * 0.85}px`;
              } catch (e) {}
            }, 50);
          }
          return;
        }

        if (anyWin.turnstile && typeof anyWin.turnstile.render === 'function') {
          // render expects the element (or selector) and options
          anyWin.turnstile.render(el, { sitekey: key });

          // small delay to allow widget to mount, then scale it down a bit
          setTimeout(() => {
            const iframe = el.querySelector('iframe') as HTMLIFrameElement | null;
            if (iframe) {
              iframe.style.transform = 'scale(0.85)';
              iframe.style.transformOrigin = 'left top';
              try {
                el.style.height = `${iframe.offsetHeight * 0.85}px`;
              } catch (e) {}
            }
          }, 60);
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
