/**
 * Wrapper fetch qui intercepte les réponses 401 (session expirée)
 * et déclenche automatiquement une redirection vers /login
 */

// Flag pour éviter les redirections multiples simultanées
let isRedirecting = false;

/**
 * Déclenche l'événement auth-refresh pour notifier les composants
 * et redirige vers /login si la session est invalide
 */
export function triggerAuthRefresh(): void {
  if (typeof window === 'undefined') return;
  
  // Émet l'événement pour que AuthWrapper et useAuthRedirect re-vérifient
  window.dispatchEvent(new CustomEvent('auth-refresh'));
}

/**
 * Redirige vers /login si pas déjà en cours de redirection
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined' || isRedirecting) return;
  
  // Ne pas rediriger si déjà sur une page publique
  const publicPaths = ['/login', '/register', '/forgot-password', '/cgu', '/mentions-legales', '/validate', '/'];
  const currentPath = window.location.pathname;
  
  if (publicPaths.some(path => currentPath === path || currentPath.startsWith('/validate/'))) {
    return;
  }
  
  isRedirecting = true;
  
  // Déclencher l'événement pour les listeners
  triggerAuthRefresh();
  
  // Redirection immédiate
  window.location.href = '/login';
  
  // Reset le flag après un délai (au cas où la redirection échoue)
  setTimeout(() => {
    isRedirecting = false;
  }, 3000);
}

/**
 * Fetch wrapper qui intercepte automatiquement les 401
 * et déclenche la redirection vers /login
 * 
 * @param input - URL ou Request
 * @param init - Options fetch (credentials: 'include' ajouté automatiquement)
 * @returns Promise<Response>
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // S'assurer que credentials: 'include' est toujours présent
  const options: RequestInit = {
    ...init,
    credentials: 'include',
  };

  const response = await fetch(input, options);

  // Si 401, la session est invalide → redirection
  if (response.status === 401) {
    redirectToLogin();
  }

  return response;
}

/**
 * Vérifie si une response indique une session expirée
 * Utile pour les appels fetch existants
 */
export function checkAuthResponse(response: Response): boolean {
  if (response.status === 401) {
    redirectToLogin();
    return false;
  }
  return true;
}

export default authFetch;
