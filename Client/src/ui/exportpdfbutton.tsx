// Client/src/ui/exportpdfbutton.tsx
"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Icons from '@/ui/Icon';

interface ExportPDFButtonProps {
  noteTitle: string;
  editorRef?: React.RefObject<HTMLElement | null>; // Ref vers le ContentEditable de Lexical
  className?: string;
  compact?: boolean; // Mode compact pour la toolbar
}

export default function ExportPDFButton({
  noteTitle,
  editorRef,
  className = "",
  compact = false
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Récupérer le contenu HTML de l'éditeur
      let noteContent = '';
      if (editorRef?.current) {
        noteContent = editorRef.current.innerHTML;
      } else {
        // Fallback: chercher l'éditeur dans le DOM
        const editor = document.querySelector('.editor-root');
        if (editor) {
          noteContent = editor.innerHTML;
        }
      }

      // Créer un élément temporaire pour le rendu
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.fontFamily = 'Gantari, sans-serif';

      // Structure du document
      tempDiv.innerHTML = `
          ${noteContent}
      `;

      document.body.appendChild(tempDiv);

      // Convertir en canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Supprimer l'élément temporaire
      document.body.removeChild(tempDiv);

      // Créer le PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      // Ajouter l'image au PDF (avec gestion multi-pages)
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= 297; // A4 height

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= 297;
      }

      // Télécharger le PDF
      const fileName = `${noteTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    // Version compacte pour la toolbar
    return (
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Exporter en PDF"
        aria-label="Exporter en PDF">
        {isExporting ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <Icons name="PDF" />
        )}
      </button>
    );
  }

  // Version complète (bouton standard)
  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting}
      className={`
        px-4 py-2 rounded-lg font-medium
        bg-[#882626] text-white
        hover:bg-[#a02e2e] 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        flex items-center gap-2
        ${className}
      `}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Export en cours...
        </>
      ) : (
        <>
          <Icons name="PDF" />
          Export PDF
        </>
      )}
    </button>
  );
}