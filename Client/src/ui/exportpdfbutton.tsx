// Client/src/ui/exportpdfbutton.tsx
"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFIcon } from '@/libs/Icons';

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

  // Fonction pour convertir oklch/oklab et autres couleurs modernes en RGB
  const convertModernColorsToRgb = (element: HTMLElement) => {
    const modernColorRegex = /oklch|oklab|lch|lab|color\(/i;
    
    const processElement = (el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      
      // Liste des propriétés de couleur à vérifier
      const colorProperties = [
        'color', 'background-color', 'border-color',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'outline-color', 'text-decoration-color'
      ];
      
      colorProperties.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && modernColorRegex.test(value)) {
          // Créer un élément temporaire pour convertir la couleur
          const temp = document.createElement('div');
          temp.style.color = value;
          document.body.appendChild(temp);
          const rgbValue = window.getComputedStyle(temp).color;
          document.body.removeChild(temp);
          
          // Appliquer la couleur RGB convertie
          if (rgbValue && rgbValue.startsWith('rgb')) {
            el.style.setProperty(prop, rgbValue);
          } else {
            // Fallback vers des couleurs sûres
            if (prop === 'background-color') {
              el.style.setProperty(prop, 'transparent');
            } else {
              el.style.setProperty(prop, '#000000');
            }
          }
        }
      });
      
      // Traiter les enfants
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          processElement(child);
        }
      });
    };
    
    processElement(element);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Trouver l'éditeur dans le DOM
      const editorElement = editorRef?.current || document.querySelector('.editor-root') as HTMLElement;
      
      if (!editorElement) {
        throw new Error('Éditeur non trouvé');
      }

      // Cloner l'élément avec tous ses styles computés
      const clonedEditor = editorElement.cloneNode(true) as HTMLElement;
      
      // Fonction pour copier les styles computés sur chaque élément
      const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
        const computedStyle = window.getComputedStyle(source);
        
        // Copier tous les styles importants
        const stylesToCopy = [
          'font-family', 'font-size', 'font-weight', 'font-style',
          'color', 'background-color', 'background',
          'text-decoration', 'text-align',
          'margin', 'padding',
          'border', 'border-radius',
          'display', 'list-style-type', 'list-style-position',
          'line-height', 'white-space'
        ];
        
        stylesToCopy.forEach(prop => {
          let value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
            // Convertir les couleurs oklch en RGB si détectées
            if (/oklch|oklab|lch|lab|color\(/i.test(value)) {
              const temp = document.createElement('div');
              temp.style.setProperty(prop, value);
              document.body.appendChild(temp);
              const converted = window.getComputedStyle(temp).getPropertyValue(prop);
              document.body.removeChild(temp);
              value = converted || value;
            }
            target.style.setProperty(prop, value);
          }
        });
        
        // Récursion sur les enfants
        const sourceChildren = source.children;
        const targetChildren = target.children;
        for (let i = 0; i < sourceChildren.length; i++) {
          if (sourceChildren[i] instanceof HTMLElement && targetChildren[i] instanceof HTMLElement) {
            copyComputedStyles(sourceChildren[i] as HTMLElement, targetChildren[i] as HTMLElement);
          }
        }
      };
      
      // Copier tous les styles computés
      copyComputedStyles(editorElement, clonedEditor);

      // Créer le conteneur pour le PDF
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 794px;
        padding: 50px;
        background: #ffffff;
        z-index: -9999;
        font-family: Gantari, Arial, sans-serif;
      `;
      
      // Appliquer des styles de base au clone
      clonedEditor.style.cssText = `
        width: 100%;
        background: #ffffff;
        color: #000000;
        font-family: Gantari, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
      `;
      
      container.appendChild(clonedEditor);
      document.body.appendChild(container);

      // Convertir les couleurs modernes (oklch, etc.) en RGB pour html2canvas
      convertModernColorsToRgb(container);

      // Attendre le rendu
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capturer avec html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      });

      // Nettoyer
      document.body.removeChild(container);

      // Générer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 0;
      let remainingHeight = imgHeight;

      // Première page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        yPosition,
        imgWidth,
        imgHeight
      );

      // Pages supplémentaires si nécessaire
      remainingHeight -= pageHeight;
      while (remainingHeight > 0) {
        pdf.addPage();
        yPosition = -(imgHeight - remainingHeight);
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          yPosition,
          imgWidth,
          imgHeight
        );
        remainingHeight -= pageHeight;
      }

      // Télécharger
      const safeTitle = noteTitle.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim() || 'note';
      pdf.save(`${safeTitle}.pdf`);

    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
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
          <PDFIcon width={20} height={20} />
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
          <PDFIcon width={18} height={18} />
          Export PDF
        </>
      )}
    </button>
  );
}
