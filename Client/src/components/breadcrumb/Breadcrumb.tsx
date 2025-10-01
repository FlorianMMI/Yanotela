"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/ui/Icon';
import { GetNoteById, SaveNote } from '@/loader/loader';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  isNoteTitle?: boolean;
}



export default function Breadcrumb() {
  const pathname = usePathname();
  const [noteTitle, setNoteTitle] = useState<string>('');
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

  // Initialiser tempTitle avec un fallback dès qu'on a le noteId
  useEffect(() => {
    if (noteId && tempTitle === '') {
      setTempTitle('Titre de la note'); // Même fallback que dans page.tsx
    }
  }, [noteId, tempTitle]);

  // Charger le titre de la note
  useEffect(() => {
    const fetchNoteTitle = async () => {
      if (noteId) {
        setIsLoadingTitle(true);
        // Initialiser tempTitle avec le même fallback que page.tsx
        setTempTitle('Titre de la note');
        
        try {
          const note = await GetNoteById(noteId);
          if (note) {
            const title = note.Titre || 'Sans titre'; // Même fallback que page.tsx
            setNoteTitle(title);
            setTempTitle(title); // Synchroniser le titre temporaire
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
            Content: note.Content || '' // Préserver le contenu existant
          });
          
          if (success) {
            console.log('Titre sauvegardé:', newTitle);
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
    if (newTitle.trim() !== '' && newTitle !== noteTitle) {
      await updateNoteTitle(newTitle);
    } else if (newTitle.trim() === '') {
      // Si le titre est vide, remettre l'ancien titre
      setTempTitle(noteTitle);
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
      <div className="flex items-center space-x-2 text-sm">
        <Icon name="files" size={24} className="text-primary" />
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <p className="text-2xl text-clrprincipal">/</p>
              /*<Icon
                name="arrow-barre"
                size={24}
                className="text-gray-400"
              />*/
              
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
              <div className="flex items-center">
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
                    className="text-clrprincipal text-2xl font-semibold bg-transparent border-none outline-none focus:bg-white focus:bg-opacity-20 rounded px-2 py-1 min-w-0 max-w-xs"
                    placeholder="Titre de la note"
                  />
                )}
              </div>
            ) : (
              
              <span
                className={`${
                  item.isActive 
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
    <div className='h-8 bg-primary'>
    </div>
    </>
  );
}