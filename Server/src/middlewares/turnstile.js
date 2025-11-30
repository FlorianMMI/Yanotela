import axios from 'axios';

// verifyTurnstile(token) -> boolean
export async function verifyTurnstile(token) {
  // In tests you may want to bypass verification. Use an explicit env var to disable.
  if (process.env.TURNSTILE_DISABLED === '1' || process.env.NODE_ENV === 'test') {
    
    return true;
  }

  if (!token) return false;

  try {
    // Cloudflare expects form-encoded POST with 'secret' and 'response'
    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
    params.append('response', token);

    const resp = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000,
    });

    // Debug log - à supprimer après résolution

    return !!(resp?.data?.success);
  } catch (err) {
    console.error('Turnstile verify error:', err?.response?.data || err.message || err);
    return false;
  }
}

// Express middleware factory: reads token from `req.body[field]` or header `x-cf-turnstile-response`
export function requireTurnstile(fieldName = 'cf-turnstile-response') {
  return async function (req, res, next) {
    try {
      const token = (req.body && req.body[fieldName]) || req.headers['x-cf-turnstile-response'];
      const ok = await verifyTurnstile(token);
      if (!ok) {
        // If the client expects JSON (AJAX/API), send JSON error.
        const accepts = (req.headers.accept || '').toString();
        const isAjax = req.xhr || (req.headers['x-requested-with'] === 'XMLHttpRequest');
        const wantsJson = isAjax || accepts.indexOf('application/json') !== -1 || (req.headers['content-type'] || '').indexOf('application/json') !== -1;
        if (wantsJson) {
          return res.status(403).json({ error: 'Veuillez patienter quelques secondes, vérification de sécurité en cours...' });
        }
        // For non-JSON requests, redirect back with error
        const referer = req.get('referer') || '/login';
        const sep = referer.includes('?') ? '&' : '?';
        return res.redirect(303, `${referer}${sep}error=captcha_required`);
      }
      return next();
    } catch (err) {
      console.error('Turnstile middleware error:', err);
      return res.status(500).json({ error: 'Veuillez patienter quelques secondes, vérification de sécurité en cours...' });
    }
  };
}