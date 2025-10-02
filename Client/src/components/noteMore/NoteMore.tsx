import React, { useState, useEffect } from "react";
import { FetchPermission, UpdatePermission, AddPermission } from "@/loader/loader";
import Icons from "@/ui/Icon";
interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
}

const ROLE_LABELS = ["Fondateur", "Administrateur", "Editeur", "Lecteur"];

export default function NoteMore({ noteId, onClose }: NoteMoreProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [permissions, setPermissions] = useState<{ user: { pseudo: string, email: string, id: number }, role: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUserIdentifier, setNewUserIdentifier] = useState("");
    const [selectedRole, setSelectedRole] = useState(3); // Par défaut: Lecteur

    useEffect(() => {
        if (showShareModal) {
            setLoading(true);
            FetchPermission(noteId).then((data: any) => {
                setPermissions(data && data.success && Array.isArray(data.permissions) ? data.permissions : []);
                setLoading(false);
            });
        }
    }, [showShareModal, noteId]);

    return (
        <>
            {/* Modal Paramètres */}
            {!showShareModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
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
                                onClick={onClose}
                            >
                                <Icons name="info" size={22} className="text-primary" />
                                Infos de la note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Partager la note */}
            {showShareModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white rounded-xl min-w-[400px] w-[450px] shadow-lg overflow-hidden relative max-h-[80vh] flex flex-col">
                        <button
                            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 transition-colors z-10"
                            onClick={() => setShowShareModal(false)}
                            aria-label="Fermer"
                        >
                            <Icons name="arrow-ss-barre" size={22} className="text-primary" />
                        </button>
                        
                        <div className="p-4 pb-2 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Partager la note</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="py-8 text-center text-gray-400">Chargement...</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Liste des utilisateurs par rôle */}
                                    {[
                                        { label: 'Propriétaire', role: 0 },
                                        { label: 'Administrateur', role: 1 },
                                        { label: 'Éditeurs', role: 2 },
                                        { label: 'Lecteurs', role: 3 },
                                    ].map(({ label, role }) => {
                                        const users = permissions.filter((item) => item.role === role);
                                        return users.length > 0 && (
                                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                                <h4 className="font-medium text-sm text-gray-700 mb-2">{label}</h4>
                                                <div className="space-y-2">
                                                    {users.map((item) => (
                                                        <div key={item.user.id} className="flex items-center justify-between bg-white rounded p-2">
                                                            <div>
                                                                <div className="font-medium text-sm text-gray-800">{item.user.pseudo}</div>
                                                                <div className="text-xs text-gray-500">{item.user.email}</div>
                                                            </div>
                                                            {role > 0 && (
                                                                <select 
                                                                    value={item.role}
                                                                    onChange={async (e) => {
                                                                        const newRole = parseInt(e.target.value);
                                                                        const result = await UpdatePermission(noteId, item.user.id, newRole);
                                                                        if (result.success) {
                                                                            // Refresh permissions
                                                                            const data = await FetchPermission(noteId);
                                                                            if (data.success) setPermissions(data.permissions || []);
                                                                        } else {
                                                                            alert(result.error || 'Erreur lors de la modification');
                                                                        }
                                                                    }}
                                                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                >
                                                                    <option value={1}>Admin</option>
                                                                    <option value={2}>Éditeur</option>
                                                                    <option value={3}>Lecteur</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Section d'ajout d'utilisateur */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Ajouter un utilisateur</h4>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Email ou pseudo..."
                                    value={newUserIdentifier}
                                    onChange={(e) => setNewUserIdentifier(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value={1}>Admin</option>
                                    <option value={2}>Éditeur</option>
                                    <option value={3}>Lecteur</option>
                                </select>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!newUserIdentifier.trim()) return;
                                    
                                    const result = await AddPermission(noteId, newUserIdentifier.trim(), selectedRole);
                                    if (result.success) {
                                        setNewUserIdentifier("");
                                        // Refresh permissions
                                        const data = await FetchPermission(noteId);
                                        if (data.success) setPermissions(data.permissions || []);
                                    } else {
                                        alert(result.error || 'Erreur lors de l\'ajout');
                                    }
                                }}
                                className="w-full bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-hover transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}