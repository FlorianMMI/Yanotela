import React, { useEffect, useState } from "react";
import { GetNoteById } from "@/loader/loader";

interface NoteInfoUIProps {
    noteId: string;
}

export default function NoteInfoUI({ noteId }: NoteInfoUIProps) {
    const [noteInfo, setNoteInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            setNoteInfo(data);
        } catch (err) {
            console.error("Error fetching note by ID:", err);
            setError("Erreur lors de la récupération de la note");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
            {loading ? (
                <div className="py-8 text-center text-element">Chargement...</div>
            ) : error ? (
                <div className="py-8 text-center text-dangerous-600 font-semibold">{error}</div>
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
    );
}