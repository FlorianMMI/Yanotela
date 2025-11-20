"use client";

import { useEffect } from 'react';

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

  // Render placeholder div where Turnstile will render the widget
  return (
    <div className={className}>
      <div className="cf-turnstile" data-sitekey={siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </div>
  );
}
