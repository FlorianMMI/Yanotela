/**
 * Tests unitaires pour useAuthRedirect hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('useAuthRedirect', () => {
  let mockRouter: { push: jest.Mock };
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    mockRouter = { push: mockPush };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/notes');

    // Mock fetch
    global.fetch = jest.fn();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Clear all event listeners
    window.removeEventListener = jest.fn();
    window.addEventListener = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('devrait retourner isAuthenticated true si auth check réussit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: true }),
    });

    const { result } = renderHook(() => useAuthRedirect());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test('devrait rediriger vers /login si non authentifié', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    renderHook(() => useAuthRedirect());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('ne devrait pas rediriger si sur une page publique', async () => {
    (usePathname as jest.Mock).mockReturnValue('/login');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    renderHook(() => useAuthRedirect());

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('ne devrait pas rediriger si skipRedirect est activé', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    renderHook(() => useAuthRedirect({ skipRedirect: true }));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('devrait gérer les erreurs fetch', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderHook(() => useAuthRedirect());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('devrait utiliser NEXT_PUBLIC_API_URL pour auth check', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.yanotela.com';
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: true }),
    });

    renderHook(() => useAuthRedirect());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.yanotela.com/auth/check',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });
  });

  test('devrait écouter les événements storage', () => {
    renderHook(() => useAuthRedirect());

    expect(window.addEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'auth-refresh',
      expect.any(Function)
    );
  });

  test('devrait identifier correctement les pages publiques', async () => {
    const publicPages = ['/cgu', '/mentions-legales', '/register', '/forgot-password'];

    for (const page of publicPages) {
      (usePathname as jest.Mock).mockReturnValue(page);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      mockPush.mockClear();

      renderHook(() => useAuthRedirect());

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    }
  });
});
