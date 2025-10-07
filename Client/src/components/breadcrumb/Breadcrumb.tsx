"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/ui/Icon';
import { GetNoteById, SaveNote } from '@/loader/loader';
import NoteMore from '@/components/noteMore/NoteMore';
import Icons from '@/ui/Icon';


interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  isNoteTitle?: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [tempTitle, setTempTitle] = useState<string>(''); // Titre temporaire pour l'input
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  // Extraire l'ID de la note depuis l'URL
  const extractNoteId = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (pathname.startsWith('/notes/') && segments.length > 1) {
      return segments[1];
    }
    return null;
  };

  const noteId = extractNoteId();

  // Charger le titre de la note
  useEffect(() => {
    const fetchNoteTitle = async () => {
      if (noteId) {
        setIsLoadingTitle(true);

        try {
          const note = await GetNoteById(noteId);
          if (note && !('error' in note)) {
            const title = note.Titre || 'Sans titre'; // Même fallback que page.tsx
            setNoteTitle(title);
            setTempTitle(title); // Synchroniser le titre temporaire
          } else {
            const errorTitle = 'Erreur de chargement';
            setNoteTitle(errorTitle);
            setTempTitle(errorTitle);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du titre:', error);
          const errorTitle = 'Erreur de chargement';
          setNoteTitle(errorTitle);
          setTempTitle(errorTitle);
        } finally {
          setIsLoadingTitle(false);
        }
      }
    };

    fetchNoteTitle();
  }, [noteId]);

  // Sauvegarder le titre modifié (récupère le contenu existant pour le préserver)
  const updateNoteTitle = async (newTitle: string) => {
    if (noteId) {
      setNoteTitle(newTitle);
      setTempTitle(newTitle);

      try {
        // D'abord récupérer la note complète pour préserver le contenu
        const note = await GetNoteById(noteId);
        if (note) {
          // Sauvegarder avec le nouveau titre et l'ancien contenu
          const success = await SaveNote(noteId, {
            Titre: newTitle,
            Content: 'Content' in note ? note.Content || '' : '' // Préserver le contenu existant
          });

          if (success) {
            // Optionnel: confirmer la sauvegarde
          } else {
            console.error('Échec de la sauvegarde du titre');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du titre:', error);
      }
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    if (newTitle.trim() === '') {
      // Si le titre est vide, utiliser le fallback et sauvegarder
      const fallbackTitle = 'Titre de la note';
      setTempTitle(fallbackTitle);
      await updateNoteTitle(fallbackTitle);
    } else if (newTitle !== noteTitle) {
      // Si le titre a changé et n'est pas vide, le sauvegarder
      await updateNoteTitle(newTitle);
    }
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);

    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return [{ label: 'Accueil', isActive: true }];
    }

    if (pathname === '/notes') {
      return [
        { label: 'Mes Notes', isActive: true },
      ];
    }

    if (pathname.startsWith('/notes/') && segments.length > 1) {
      const noteId = segments[1];
      // Utiliser noteTitle s'il existe et n'est pas vide, sinon utiliser le fallback par défaut
      const displayTitle = noteTitle && noteTitle.trim() !== '' ? noteTitle : 'Titre de la note';
      return [
        { label: 'Mes Notes', href: '/notes' },
        { label: displayTitle, isActive: true, isNoteTitle: true },
      ];
    }

    if (pathname === '/forgot-password') {
      return [
        { label: 'Mot de passe oublié', isActive: true },
      ];
    }

    if (pathname.startsWith('/forgot-password/') && segments.length > 1) {
      return [
        { label: 'Mot de passe oublié', href: '/forgot-password' },
        { label: 'Réinitialisation', isActive: true },
      ];
    }
    if (pathname === '/profil') {
      return [
        { label: 'Mon Profil', isActive: true },
      ];
    }

    // Fallback pour les autres routes
    return [
      { label: 'Accueil', href: '/' },
      { label: 'Page courante', isActive: true },
    ];
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <>
      <nav className="bg-background p-3">
        <div className="flex items-center text-sm space-x-2 relative">
          {/* Déterminer l'icône selon la page courante */}
          {(() => {
            if (pathname.includes('/notes')) {
              return <Icon name="docs" size={20} className="text-primary" />;
            }
            if (pathname.includes('/profil')) {
              return <Icon name="profile" size={20} className="text-primary" />;
            }
          })()}
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <p className="text-2xl text-clrprincipal">/</p>
              )}
              {item.href && !item.isActive ? (
                <Link
                  href={item.href}
                  className="text-clrprincipal hover:text-rouge-hover text-2xl transition-colors font-bold"
                >
                  {item.label}
                </Link>
              ) : item.isNoteTitle ? (
                // Input pour le titre de la note
                <div className="flex items-center space-x-2">
                  {isLoadingTitle ? (
                    <span className="text-clrprincipal text-2xl font-semibold animate-pulse">
                      Chargement...
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={(e) => handleTitleSave(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-clrprincipal text-2xl font-semibold bg-transparent border-none outline-none focus:bg-white focus:bg-opacity-20 rounded py-1 min-w-0 max-w-xs"
                      placeholder="Titre de la note"
                    />
                  )}
                      {/* Container pour pousser l'icône complètement à droite */}
                      <div className="flex-1 flex justify-end min-w-0 absolute right-4 top-2">
                      <span
                        onClick={() => setShowNoteMore((prev) => !prev)}
                        className="ml-2"
                      >
                        <Icons
                        name="more"
                        size={30}
                        className="text-primary cursor-pointer"
                        />
                      </span>
                      {showNoteMore && (
                        <div className="absolute right-0 mt-10 z-20">
                        <NoteMore noteId={noteId!} onClose={() => setShowNoteMore(false)} />
                        </div>
                      )}
                      </div>
                </div>
              ) : (
                <span
                  className={`${item.isActive
                    ? 'text-clrprincipal text-2xl font-semibold'
                    : 'text-gray-500'
                    } `}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

      </nav>

    </>
  );
}