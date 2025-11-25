"use client";

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey?: string;
  className?: string;
  aspectRatio?: string; // e.g. '5/1' or '16/9'
}

export default function Turnstile({ siteKey, className = '', aspectRatio = '5/1' }: TurnstileProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = siteKey || (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined);
    if (!key) return;

    // from auto-rendering widgets so we control rendering and avoid duplicate widgets.
    if (!document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
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
        // If we've already rendered into this container, skip to avoid Cloudflare warning
        if (el.dataset.turnstileRendered === '1') return;
        // If the Cloudflare turnstile lib is available, explicitly render this widget
        const anyWin = window as any;
        // Prevent duplicate widget: if an iframe is already present, mark as rendered and skip rendering
        if (el.querySelector('iframe')) {
          const existing = el.querySelector('iframe') as HTMLIFrameElement | null;
          if (existing) {
            // make iframe fill its container (the wrapper uses aspect-ratio)
            existing.style.position = 'absolute';
            existing.style.inset = '0';
            existing.style.width = '100%';
            existing.style.height = '100%';
            existing.style.maxWidth = '100%';
            existing.style.boxSizing = 'border-box';
            existing.style.border = '0';
            try { el.dataset.turnstileRendered = '1'; } catch (e) {}
          }
          return;
        }

        if (anyWin.turnstile && typeof anyWin.turnstile.render === 'function') {
          // render expects the element (or selector) and options
          // Create or reuse a hidden input to store the Turnstile token so forms can read it.
          const ensureTokenInput = () => {
            let input = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
            if (!input) {
              input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'cf-turnstile-response';
              input.value = '';
              // attach to body so temporary forms can pick it up when they are created
              document.body.appendChild(input);
            }
            return input;
          };

          const tokenInput = ensureTokenInput();

          // Provide callback to populate the hidden input when Turnstile returns a token
          const widgetId = anyWin.turnstile.render(el, {
            sitekey: key,
            callback: (token: string) => {
              try { tokenInput.value = token || ''; } catch (e) {}
            },
            'expired-callback': () => {
              try { tokenInput.value = ''; } catch (e) {}
            }
          });

          // mark container rendered to avoid duplicate render attempts
          try { el.dataset.turnstileRendered = '1'; } catch (e) {}

          // small delay to allow widget to mount, then ensure iframe fills the wrapper
          setTimeout(() => {
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

  // Render placeholder div where Turnstile will render the widget.
  // Use a wrapper with CSS `aspect-ratio` to keep a consistent height while allowing full width.
  return (
    <div className={className}>
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio }}
      >
        <div
          ref={containerRef}
          className="cf-turnstile absolute inset-0 w-full h-full"
          data-sitekey={siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </div>
    </div>
  );
}
