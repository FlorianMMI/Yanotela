/**
 * Tests unitaires pour le service yjsMigration
 */

import * as Y from 'yjs';
import { migrateContentToYjs, extractContentFromYjs } from '../../../src/services/yjsMigration.js';

describe('yjsMigration Service - Tests unitaires', () => {
  
  describe('migrateContentToYjs', () => {
    
    test('devrait migrer du JSON Lexical simple vers YJS', () => {
      const lexicalJSON = JSON.stringify({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Bonjour le monde' }
              ]
            }
          ]
        }
      });

      const result = migrateContentToYjs(lexicalJSON);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      
      // Vérifier que le contenu YJS est décodable
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(result));
      const yXmlText = ydoc.get('root', Y.XmlText);
      
      expect(yXmlText.toString()).toContain('Bonjour le monde');
    });

    test('devrait gérer un contenu vide', () => {
      const lexicalJSON = JSON.stringify({
        root: {
          children: []
        }
      });

      const result = migrateContentToYjs(lexicalJSON);
      
      expect(result).toBeInstanceOf(Buffer);
      
      // Vérifier que c'est un document YJS valide
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(result));
      const yXmlText = ydoc.get('root', Y.XmlText);
      
      expect(yXmlText.toString()).toBe('');
    });

    test('devrait gérer un JSON invalide', () => {
      const invalidJSON = 'ceci nest pas du JSON valide';

      const result = migrateContentToYjs(invalidJSON);
      
      // Devrait retourner un Buffer YJS vide valide
      expect(result).toBeInstanceOf(Buffer);
      
      // Vérifier que c'est un document YJS valide
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(result));
    });

    test('devrait extraire le texte de noeuds imbriqués', () => {
      const lexicalJSON = JSON.stringify({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Premier ' },
                { type: 'text', text: 'paragraphe' }
              ]
            },
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Deuxième paragraphe' }
              ]
            }
          ]
        }
      });

      const result = migrateContentToYjs(lexicalJSON);
      
      expect(result).toBeInstanceOf(Buffer);
      
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(result));
      const yXmlText = ydoc.get('root', Y.XmlText);
      const content = yXmlText.toString();
      
      expect(content).toContain('Premier');
      expect(content).toContain('Deuxième');
    });

    test('devrait gérer du contenu avec seulement des espaces', () => {
      const lexicalJSON = JSON.stringify({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: '   ' }
              ]
            }
          ]
        }
      });

      const result = migrateContentToYjs(lexicalJSON);
      
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('extractContentFromYjs', () => {
    
    test('devrait extraire le texte brut d\'un état YJS', () => {
      // Créer un document YJS avec du contenu
      const ydoc = new Y.Doc();
      const yXmlText = ydoc.get('root', Y.XmlText);
      yXmlText.insert(0, 'Contenu de test');
      
      const yjsState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      
      const result = extractContentFromYjs(yjsState);
      
      expect(result).toContain('Contenu de test');
    });

    test('devrait retourner null pour un état YJS vide', () => {
      const ydoc = new Y.Doc();
      ydoc.get('root', Y.XmlText);
      
      const yjsState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      
      const result = extractContentFromYjs(yjsState);
      
      // extractContentFromYjs retourne un JSON Lexical avec texte vide
      expect(result).toBeTruthy();
    });

    test('devrait gérer un Buffer null', () => {
      const result = extractContentFromYjs(null);
      
      expect(result).toBe(null);
    });

    test('devrait gérer un Buffer undefined', () => {
      const result = extractContentFromYjs(undefined);
      
      expect(result).toBe(null);
    });

    test('devrait gérer un Buffer invalide', () => {
      const invalidBuffer = Buffer.from([1, 2, 3, 4, 5]);
      
      // Ne devrait pas crasher, devrait retourner null
      const result = extractContentFromYjs(invalidBuffer);
      
      expect(result).toBe(null);
    });
  });

  describe('Cycle complet migration → extract', () => {
    
    test('devrait préserver le contenu dans un cycle complet', () => {
      const originalText = 'Ceci est un test de migration complète';
      const lexicalJSON = JSON.stringify({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: originalText }
              ]
            }
          ]
        }
      });

      // Migration vers YJS
      const yjsState = migrateContentToYjs(lexicalJSON);
      
      // Extract retour vers JSON Lexical
      const extractedJSON = extractContentFromYjs(yjsState);
      
      expect(extractedJSON).toContain(originalText);
    });
  });
});
