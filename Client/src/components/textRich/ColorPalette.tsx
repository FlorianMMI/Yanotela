import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ColorPaletteProps = {
    value: string;
    onChange: (color: string) => void;
    colors?: string[];
    small?: boolean;
    asButton?: boolean; // render a trigger button that opens the overlay
    buttonIcon?: React.ReactNode;
};

const DEFAULT_COLORS = [
    '#000000',
    '#D4AF37',
    '#FF6B6B',
    '#4CAF50',
    '#2196F3',
    '#9C27B0',
    '#FFFFFF',
];

function hexToRgb(hex: string) {
    const h = hex.replace('#', '').trim();
    const parsed = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const bigint = parseInt(parsed, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function luminance(hex: string) {
    try {
        const { r, g, b } = hexToRgb(hex);
        const srgb = [r, g, b].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    } catch {
        return 0;
    }
}

export default function ColorPalette({
    value,
    onChange,
    colors = DEFAULT_COLORS,
    small = false,
    asButton = false,
    buttonIcon,
}: ColorPaletteProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        const onPointer = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (triggerRef.current && triggerRef.current.contains(target)) return;
            if (overlayRef.current && overlayRef.current.contains(target)) return;
            setIsOpen(false);
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [isOpen]);

    const openAtTrigger = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
        } else {
            setPos({ top: window.scrollY + 100, left: window.scrollX + 100 });
        }
        setIsOpen(true);
    };

    const palette = (
        <div className="inline-flex items-center">
            <div className="flex gap-1 items-center">
                {colors.map((c) => {
                    const isActive = c.toLowerCase() === (value || '').toLowerCase();
                    const lum = luminance(c);
                    const borderColor = lum > 0.7 ? '#000' : '#fff';
                    const sizeClass = small ? 'w-4 h-4' : 'w-6 h-6';
                    return (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onChange(c)}
                            aria-label={`Select color ${c}`}
                            className={`${sizeClass} rounded-sm border`}
                            style={{
                                background: c,
                                borderColor: isActive ? '#000' : borderColor,
                                boxShadow: isActive ? '0 0 0 2px rgba(0,0,0,0.12) inset' : undefined,
                            }}
                        />
                    );
                })}
                <input
                    ref={inputRef}
                    type="color"
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        background: value,
                        borderColor: luminance(value) > 0.7 ? '#000' : '#fff',
                        boxShadow : '0 0 0 1px rgba(0,0,0,0.12) inset',
                    }} 
                    aria-hidden={true}
                />
            </div>
        </div>
    );

    if (!asButton) {
        return <div className={`inline-flex items-center ${small ? 'h-7' : ''}`}>{palette}</div>;
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (isOpen ? setIsOpen(false) : openAtTrigger())}
                aria-label="Ouvrir la palette de couleurs"
                className={`flex items-center justify-center rounded-md p-1 ${small ? 'w-7 h-7' : 'w-8 h-8'} border border-gray-200 bg-white`}
            >
                {React.isValidElement(buttonIcon)
                    ? React.cloneElement(buttonIcon as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
                            // keep existing styles but enforce color via inline style (dynamic)
                            style: { ...((buttonIcon as React.ReactElement<React.SVGProps<SVGSVGElement>>).props?.style ?? {}), color: value },
                            // use Tailwind for sizing/layout, preserve existing className
                            className: [
                                (buttonIcon as React.ReactElement<React.SVGProps<SVGSVGElement>>).props?.className ?? '',
                                small ? 'w-5 h-5' : 'w-5 h-5',
                                'inline-block',
                            ]
                                .filter(Boolean)
                                .join(' '),
                        })
                    : buttonIcon ?? (
                            <span
                                className={`${small ? 'w-5 h-5' : 'w-5 h-5'} rounded-sm inline-block`}
                                style={{ background: value }}
                                aria-hidden="true"
                            />
                        )}
            </button>

            {isOpen && pos
                ? createPortal(
                    <div id="color-palette-overlay" style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}>
                        <div ref={overlayRef} className="bg-white p-2 rounded shadow-lg border border-gray-200">
                            {palette}
                        </div>
                    </div>,
                    document.body,
                )
                : null}
        </>
    );
}
