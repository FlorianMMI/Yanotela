"use client";

import {$getRoot, $getSelection} from 'lexical';
import {useEffect, useState} from 'react';

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import ReturnButton from '@/ui/returnButton';

const theme = {
  // Theme styling goes here
  //...
}

function onError(error: string | Error) {
  console.error(error);
}


export default function NoteEditor() {
  const [noteTitle, setNoteTitle] = useState('Titre de la note');

  const initialConfig = {
    namespace: 'Editor',
    theme,
    onError,
  };

  return (
    <div className="flex flex-col p-2.5 bg-background h-full gap-2.5">
      <div className="flex rounded-lg p-2.5 items-center bg-primary text-white">
        <ReturnButton />
        <p className="font-gant font-bold">{noteTitle}</p>
      </div>
      <div className="relative bg-white p-4 rounded-lg h-full">
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-placeholder={'Commencez à écrire...'}
                placeholder={<p className="absolute top-4 left-4 text-gray-500">Commencez à écrire...</p>}
                className="h-full focus:outline-none"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
        </LexicalComposer>
      </div>
    </div>
  );
}
