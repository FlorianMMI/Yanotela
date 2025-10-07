
import React, { useState } from "react";
import Icons from "@/ui/Icon";
import NoteShare from "../noteShare/NoteShare";
import NoteInfo from "../noteInfo/NoteInfo";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
}

export default function NoteMore({ noteId, onClose }: NoteMoreProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    return (
        <>
            {/* Modal Paramètres */}
            {!showShareModal && !showInfoModal && (
        <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col">
            <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-deskbackground transition-colors z-10"
                onClick={onClose}
                aria-label="Fermer"
            >
                <Icons name="arrow-ss-barre" size={22} className="text-primary" />
            </button>
            <div className="p-4 pb-2 border-b border-element">
                <h3 className="text-lg font-semibold text-foreground">Option de la note</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-1 py-2">
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium transition-colors"
                                onClick={() => setShowShareModal(true)}
                            >
                                <Icons name="partage" size={22} className="text-primary" />
                                Partager la note
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setShowInfoModal(true)}
                            >
                                <Icons name="info" size={22} className="text-primary" />
                                Infos de la note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Partager la note */}
            {showInfoModal && (
                <NoteInfo noteId={noteId} onClose={() => setShowInfoModal(false)} />
            )}

            {/* Modal Partager la note */}
            {showShareModal && (
                <NoteShare noteId={noteId} onClose={() => setShowShareModal(false)} />
            )}
        </>
    );
}