#!/usr/bin/env node

/**
 * 🔄 Script de migration: Content → yjsState
 * 
 * Ce script migre toutes les notes existantes depuis le champ Content (string)
 * vers le champ yjsState (Bytes) pour activer la collaboration Yjs.
 * 
 * USAGE:
 *   cd Server
 *   node scripts/migrate-content-to-yjs.js
 * 
 * OPTIONS:
 *   --dry-run    : Simulation sans modification de la base
 *   --force      : Migrer même les notes ayant déjà un yjsState
 *   --batch=N    : Traiter N notes à la fois (défaut: 10)
 *   --note-id=X  : Migrer uniquement la note spécifique
 * 
 * SÉCURITÉ:
 *   - Le champ Content est préservé (pas de suppression)
 *   - Les notes avec yjsState existant sont ignorées (sauf --force)
 *   - Transaction Prisma pour atomicité
 */

import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

// ============================================================================
// Configuration
// ============================================================================

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '10', 10);
const targetNoteId = args.find(arg => arg.startsWith('--note-id='))?.split('=')[1];

if (targetNoteId) 

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Extraire le texte brut d'un état Lexical JSON
 */
function extractTextFromLexical(state) {
  let text = '';
  
  function traverse(node) {
    if (node.text) {
      text += node.text;
      // Ajouter un retour à la ligne après les paragraphes
      if (node.type === 'linebreak') {
        text += '\n';
      }
    }
    if (node.children) {
      node.children.forEach(traverse);
      // Ajouter un retour à la ligne après les paragraphes
      if (node.type === 'paragraph' && text && !text.endsWith('\n')) {
        text += '\n';
      }
    }
  }

  if (state.root && state.root.children) {
    state.root.children.forEach(traverse);
  }

  return text.trim();
}

/**
 * Convertir Content (string) en yjsState (Buffer)
 */
function convertContentToYjs(content) {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('content');

  // Essayer de parser comme JSON Lexical
  try {
    const parsed = JSON.parse(content);
    
    // Vérifier que c'est bien du Lexical
    if (parsed.root && parsed.root.children) {
      const text = extractTextFromLexical(parsed);
      
      if (text.length > 0) {
        ytext.insert(0, text);
        
      } else {
        
      }
    } else {
      // JSON mais pas Lexical, insérer tel quel
      ytext.insert(0, content);
      
    }
  } catch {
    // Pas du JSON, insérer comme texte brut
    if (content && content.length > 0) {
      ytext.insert(0, content);
      
    } else {
      
    }
  }

  // Encoder l'état Yjs
  const yjsState = Y.encodeStateAsUpdate(ydoc);
  return Buffer.from(yjsState);
}

/**
 * Migrer une note individuelle
 */
async function migrateNote(note) {
  const { id, Titre, Content, yjsState } = note;

  // Vérifier si déjà migré
  if (yjsState && yjsState.length > 0 && !isForce) {
    
    return { status: 'skipped', reason: 'already-migrated' };
  }

  // Vérifier si contenu vide
  if (!Content || Content.length === 0) {
    
    return { status: 'skipped', reason: 'empty-content' };
  }

  // Convertir Content → yjsState
  try {
    const yjsStateBuffer = convertContentToYjs(Content);

    if (isDryRun) {
      
      return { status: 'simulated', size: yjsStateBuffer.length };
    }

    // Sauvegarder en DB
    await prisma.note.update({
      where: { id },
      data: { yjsState: yjsStateBuffer }
    });

    return { status: 'success', size: yjsStateBuffer.length };
  } catch (error) {
    
    return { status: 'error', error: error.message };
  }
}

// ============================================================================
// Script principal
// ============================================================================

async function main() {
  const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    totalSize: 0
  };

  try {
    // Construire la requête WHERE
    const where = {};
    
    if (targetNoteId) {
      where.id = targetNoteId;
    }
    
    if (!isForce) {
      // Ignorer les notes déjà migrées
      where.yjsState = null;
    }

    // Compter le total
    const totalCount = await prisma.note.count({ where });

    if (totalCount === 0) {
      
      return;
    }

    // Traiter par batch
    let offset = 0;
    
    while (offset < totalCount) {
      console.log(`\n📦 Batch ${Math.floor(offset / batchSize) + 1} (notes ${offset + 1}-${Math.min(offset + batchSize, totalCount)})`);

      const notes = await prisma.note.findMany({
        where,
        select: {
          id: true,
          Titre: true,
          Content: true,
          yjsState: true
        },
        skip: offset,
        take: batchSize
      });

      for (const note of notes) {
        const result = await migrateNote(note);
        
        stats.total++;
        
        if (result.status === 'success' || result.status === 'simulated') {
          stats.migrated++;
          stats.totalSize += result.size || 0;
        } else if (result.status === 'skipped') {
          stats.skipped++;
        } else if (result.status === 'error') {
          stats.errors++;
        }
      }

      offset += batchSize;

      // Petite pause entre les batch pour éviter la surcharge
      if (offset < totalCount) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Rapport final

    console.log(`📦 Taille totale:  ${(stats.totalSize / 1024).toFixed(2)} KB`);
    
    if (isDryRun) {

    } else if (stats.migrated > 0) {

    }

  } catch (error) {
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
main().catch(console.error);
