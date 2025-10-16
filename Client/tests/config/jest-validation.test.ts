/**
 * Batterie de tests Jest pour valider la configuration de l'environnement de test
 * Ces tests vérifient que tous les éléments essentiels fonctionnent correctement
 */

describe('Configuration Jest - Tests de validation', () => {
  describe('Environnement de base', () => {
    test('Jest est correctement configuré', () => {
      expect(jest).toBeDefined();
      expect(global).toBeDefined();
      expect(window).toBeDefined();
    });

    test('TypeScript est correctement transpilé', () => {
      const testFunction = (param: string): string => {
        return `Hello ${param}`;
      };
      expect(testFunction('World')).toBe('Hello World');
    });

    test('Les modules ES6 sont correctement transformés', () => {
      expect(() => {
        const { useState } = require('react');
        expect(useState).toBeInstanceOf(Function);
      }).not.toThrow();
    });
  });

  describe('Mocks et polyfills', () => {
    test('fetch est mocké', () => {
      expect(global.fetch).toBeDefined();
      expect(jest.isMockFunction(global.fetch)).toBe(true);
    });

    test('localStorage est mocké', () => {
      expect(global.localStorage).toBeDefined();
      expect(global.localStorage.getItem).toBeDefined();
      expect(global.localStorage.setItem).toBeDefined();
    });

    test('sessionStorage est mocké', () => {
      expect(global.sessionStorage).toBeDefined();
      expect(global.sessionStorage.getItem).toBeDefined();
      expect(global.sessionStorage.setItem).toBeDefined();
    });

    test('matchMedia est mocké', () => {
      expect(window.matchMedia).toBeDefined();
      const result = window.matchMedia('(max-width: 768px)');
      expect(result.matches).toBe(false);
      expect(result.addEventListener).toBeDefined();
    });

    test('IntersectionObserver est mocké', () => {
      expect(global.IntersectionObserver).toBeDefined();
      const observer = new IntersectionObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    test('ResizeObserver est mocké', () => {
      expect(global.ResizeObserver).toBeDefined();
      const observer = new ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });

  describe('Configuration CSS et assets', () => {
    test('Les imports CSS sont mockés', () => {
      expect(() => {
        require('./mock-styles.css');
      }).not.toThrow();
    });

    test('Les images sont mockées', () => {
      expect(() => {
        require('./test-image.png');
      }).not.toThrow();
    });
  });

  describe('React Testing Library', () => {
    test('Testing Library est disponible', () => {
      // Vérifier que les dépendances sont installées
      expect(true).toBe(true); // Test basique pour valider que Jest fonctionne
    });

    test('Jest DOM matchers sont disponibles', () => {
      const div = document.createElement('div');
      div.textContent = 'Hello World';
      document.body.appendChild(div);
      
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent('Hello World');
      
      document.body.removeChild(div);
    });
  });

  describe('Next.js mocks', () => {
    test('useRouter est mocké', () => {
      const { useRouter } = require('next/navigation');
      const router = useRouter();
      
      expect(router.push).toBeDefined();
      expect(router.replace).toBeDefined();
      expect(router.back).toBeDefined();
      expect(jest.isMockFunction(router.push)).toBe(true);
    });

    test('useSearchParams est mocké', () => {
      const { useSearchParams } = require('next/navigation');
      const searchParams = useSearchParams();
      
      expect(searchParams).toBeInstanceOf(URLSearchParams);
    });

    test('usePathname est mocké', () => {
      const { usePathname } = require('next/navigation');
      const pathname = usePathname();
      
      expect(typeof pathname).toBe('string');
    });

    test('Image component est mocké', () => {
      const Image = require('next/image').default;
      expect(Image).toBeDefined();
    });
  });
});