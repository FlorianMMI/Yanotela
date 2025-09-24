import React from 'react';
import Image from 'next/image';
import { Note as NoteType } from '@/type/Note';

interface NoteProps {
  note: NoteType;
}

export default function Note({ note }: NoteProps) {
  const getColorClasses = (color: NoteType['color']) => {
    switch (color) {
      case 'red': return 'bg-red-700 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'orange': return 'bg-orange-400 text-white';
      case 'blue': return 'bg-blue-600 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      default: return 'bg-red-700 text-white';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      {/* Course Badge */}
      <div className={`${getColorClasses(note.color)} px-4 py-3 flex items-center justify-between w-full`}>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{note.participantCount}</span>
          <Image
            src="/share.svg"
            alt="Participants"
            width={16}
            height={16}
          />
        </div>
      </div>
      
      {/* Note Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 leading-5">{note.title}</h3>
        <p className="text-sm text-gray-600 mb-3 leading-5">{note.content}</p>
        
        {/* Desktop: Show modification date */}
        <div className="hidden md:block">
          <p className="text-xs text-gray-500 italic">
            Mod. {note.modifiedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}