


import React, { useEffect, useState } from "react";
import { GetNoteById } from "@/loader/loader";
import Icons from "@/ui/Icon";
import { get } from "http";


interface NoteInfoProps {
    noteId: string;
    onClose: () => void;
}


export default function NoteInfo({ noteId, onClose }: NoteInfoProps) {
    const [noteInfo, setNoteInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    console.log("Note ID received in NoteInfo component:", noteId);
    useEffect(() => {
        if (noteId) {
            getNoteById(noteId);
        }
    }, [noteId]);
    async function getNoteById(id: string) {
        setLoading(true);
        setError(null);
        try {
            const data = await GetNoteById(id);
            console.log("Data received from GetNoteById:", data);
            setNoteInfo(data);
        } catch (err) {
            console.error("Error fetching note by ID:", err);
            setError("Erreur lors de la récupération de la note");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col">
            <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-deskbackground transition-colors z-10"
                onClick={onClose}
                aria-label="Fermer"
            >
                <Icons name="arrow-ss-barre" size={22} className="text-primary" />
            </button>
            <div className="p-4 pb-2 border-b border-element">
                <h3 className="text-lg font-semibold text-foreground">Infos la note</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="py-8 text-center text-element">Chargement...</div>
                ) : error ? (
                    <div className="py-8 text-center text-red-600 font-semibold">{error}</div>
                ) : (
                    <div className="space-y-5">
                        <div className="border-b border-gray-100 pb-4">
                            <span className="block text-xs text-element mb-1">Titre</span>
                            <span className="block text-base font-semibold text-foreground">{noteInfo?.Titre}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-4">
                            <span className="block text-xs text-element mb-1">Auteur</span>
                            <span className="block text-base font-medium text-foreground">{noteInfo?.author || "-"}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-element mb-1">Dernière modification</span>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-foreground">Par : <span className="font-medium">{noteInfo?.modifier || "-"}</span></span>
                                <span className="text-sm text-foreground">Date : <span className="font-medium">{noteInfo?.ModifiedAt ? new Date(noteInfo.ModifiedAt).toLocaleDateString("fr-FR") + " à " + new Date(noteInfo.ModifiedAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }) : "-"}</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}