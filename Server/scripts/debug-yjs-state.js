/**
 * Debug script to decode and inspect yjsState of a note
 */

import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

async function debugNoteYjsState(noteId) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        Titre: true,
        Content: true,
        yjsState: true,
      },
    });

    if (!note) {
      
      return;
    }

    if (note.yjsState && note.yjsState.length > 0) {
      // Decode YJS state
      const ydoc = new Y.Doc();
      const stateBuffer = Buffer.isBuffer(note.yjsState) ? note.yjsState : Buffer.from(note.yjsState);
      Y.applyUpdate(ydoc, new Uint8Array(stateBuffer));

      // Get the YXmlText
      const yXmlText = ydoc.get('root', Y.XmlText);
      const plainText = yXmlText.toString();

      console.log('\nFull YXmlText structure:', JSON.stringify(yXmlText.toJSON(), null, 2));
    } else {
      
    }

  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

// Get note ID from command line
const noteId = process.argv[2];
if (!noteId) {
  
  process.exit(1);
}

debugNoteYjsState(noteId);
