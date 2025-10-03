
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
                <div>
                    <div className="bg-white rounded-2xl shadow-2xl min-w-[300px] w-[350px] max-w-full overflow-hidden flex flex-col animate-fade-in">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-300 bg-gray-50">
                            <span className="text-lg font-semibold text-primary">Options de la note</span>
                            <button
                                className="p-2 rounded hover:bg-gray-200 transition-colors"
                                onClick={onClose}
                                aria-label="Fermer"
                            >
                                <Icons name="arrow-ss-barre" size={22} className="text-primary" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-1 py-2">
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-gray-50 hover:text-primary-hover w-full text-left text-base font-medium transition-colors"
                                onClick={() => setShowShareModal(true)}
                            >
                                <Icons name="partage" size={22} className="text-primary" />
                                Partager la note
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-gray-50 hover:text-primary-hover w-full text-left text-base font-medium border-t border-gray-100 transition-colors"
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