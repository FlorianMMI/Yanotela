"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

import FlashNoteButton from '@/ui/flash-note-button';

export default function MobileFlashNoteButton() {
  const router = useRouter();

  const handleOpenFlashNote = () => {
    // Rediriger vers la page Flash Note complète
    router.push('/flashnote');
  };

  return (
    <>
      {/* Bouton flottant en bas à droite */}
      <div className="fixed bottom-10 right-6 z-40 md:hidden">
        <FlashNoteButton 
          isOpen={false}
          onClick={handleOpenFlashNote}
          className="p-0"
        />
      </div>
    </>
  );
}
