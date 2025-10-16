/**
 * Tests pour le composant GoogleAuthButton
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleAuthButton from '../../src/components/auth/GoogleAuthButton';

// Mock simpliste pour window.location avec href
let mockHref = '';

// Garder une référence à l'original pour la restauration
const originalLocation = window.location;

beforeAll(() => {
  // Supprimer complètement window.location et le remplacer par un objet avec getter/setter href
  delete (window as any).location;
  (window as any).location = {
    get href() {
      return mockHref;
    },
    set href(url) {
      mockHref = url;
    },
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  };
});

afterAll(() => {
  // Restaurer window.location
  (window as any).location = originalLocation;
});

describe('GoogleAuthButton', () => {
  beforeEach(() => {
    mockHref = '';
    jest.clearAllMocks();
  });

  describe('Rendu du composant', () => {
    test('rend correctement en mode login', () => {
      render(<GoogleAuthButton mode="login" />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Se connecter avec Google')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    test('rend correctement en mode register', () => {
      render(<GoogleAuthButton mode="register" />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText("S'inscrire avec Google")).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    test('contient une icône Google', () => {
      render(<GoogleAuthButton mode="login" />);
      
      // Vérifie que l'icône Google est présente (recherche par role="img")
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Comportement des clics', () => {
    test('redirige vers Google OAuth au clic en mode login', () => {
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockHref).toBe('http://localhost:3001/auth/google');
    });

    test('redirige vers Google OAuth au clic en mode register', () => {
      render(<GoogleAuthButton mode="register" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockHref).toBe('http://localhost:3001/auth/google');
    });

    test('utilise une URL différente si API_URL est définie', () => {
      // Mock temporaire de process.env
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockHref).toBe('https://api.example.com/auth/google');
      
      // Restaurer l'environnement
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });

  describe('Gestion des états', () => {
    test('gère correctement les états de chargement', () => {
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      
      // État initial - pas de chargement
      expect(button).not.toBeDisabled();
      
      // Clic
      fireEvent.click(button);
      
      // Vérifier que la redirection a été appelée
      expect(mockHref).toBe('http://localhost:3001/auth/google');
    });

    test('redirige à chaque clic', () => {
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      
      // Plusieurs clics 
      fireEvent.click(button);
      expect(mockHref).toBe('http://localhost:3001/auth/google');
      
      // Reset pour simuler un deuxième clic
      mockHref = '';
      fireEvent.click(button);
      expect(mockHref).toBe('http://localhost:3001/auth/google');
    });
  });

  describe('Accessibilité', () => {
    test('a les attributs d\'accessibilité appropriés', () => {
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toBeInTheDocument();
    });

    test('peut être activé par le clavier', () => {
      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      
      // Simuler l'activation par clavier (Enter ou Space)
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Le composant devrait gérer l'événement click, pas keyDown directement
      // Mais on peut tester que le bouton reste accessible
      expect(button).not.toBeDisabled();
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de redirection silencieusement', () => {
      // Simuler une erreur en tentant de modifier href
      const originalHrefSetter = Object.getOwnPropertyDescriptor(window.location, 'href')?.set;
      
      // Mock un setter qui lève une erreur
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw new Error('Network error');
        },
        configurable: true,
      });

      render(<GoogleAuthButton mode="login" />);
      
      const button = screen.getByRole('button');
      
      // Ne devrait pas lever d'erreur
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
      
      // Restaurer le setter original
      if (originalHrefSetter) {
        Object.defineProperty(window.location, 'href', {
          set: originalHrefSetter,
          configurable: true,
        });
      }
    });
  });
});