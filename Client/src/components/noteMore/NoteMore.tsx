import React, { useState, useEffect } from "react";
import { FetchPermission, UpdatePermission, AddPermission, RemovePermission } from "@/loader/loader";
import Icons from "@/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import NoteInfo from "../noteInfo/noteinfo";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
}

const ROLE_LABELS = ["Propriétaire", "Administrateur", "Éditeur", "Lecteur"];

export default function NoteMore({ noteId, onClose }: NoteMoreProps) {
    const auth = useAuth();
    const connectedUserId = auth.user?.id;

    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [permissions, setPermissions] = useState<{ user: { pseudo: string, email: string, id: number }, role: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUserIdentifier, setNewUserIdentifier] = useState("");
    const [selectedRole, setSelectedRole] = useState(3); // Par défaut: Lecteur
    const [currentUserRole, setCurrentUserRole] = useState<number | null>(null); // Rôle de l'utilisateur connecté

    useEffect(() => {
        if (showShareModal) {
            setLoading(true);
            FetchPermission(noteId).then((data: any) => {
                const perms = data && data.success && Array.isArray(data.permissions) ? data.permissions : [];
                setPermissions(perms);
                
                // Trouver le rôle de l'utilisateur connecté
                const currentUserPerm = perms.find((perm: any) => perm.user.id === connectedUserId);
                setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                
                setLoading(false);
            });
        }
    }, [showShareModal, noteId, connectedUserId]);

    return (
        <>
            {/* Modal Paramètres */}
            {!showShareModal && (
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

            {/* Modal Infos de la note */}
            {showInfoModal && (
                <NoteInfo note={noteId} onClose={() => setShowInfoModal(false)} />
            )}

            {/* Modal Partager la note */}
            {showShareModal && (
                <div>
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
                            {currentUserRole !== null && (
                                <div className={`mt-2 px-3 py-1 rounded-full text-sm inline-block ${
                                    currentUserRole < 4 ? 'bg-deskbackground text-primary' :
                                    'bg-deskbackground text-element'
                                }`}>
                                    Vous êtes {ROLE_LABELS[currentUserRole].toLowerCase()}
                                </div>
                            )}
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
                                                            {/* Afficher les actions seulement si l'utilisateur a les permissions ET ce n'est pas le propriétaire */}
                                                            {role > 0 && currentUserRole !== null && currentUserRole <= 1 && (
                                                                <>
                                                                    <select 
                                                                        value={item.role}
                                                                        onChange={async (e) => {
                                                                            const newRole = parseInt(e.target.value);
                                                                            const result = await UpdatePermission(noteId, item.user.id, newRole);
                                                                            if (result.success) {
                                                                                // Refresh permissions
                                                                                const data = await FetchPermission(noteId);
                                                                                if (data.success) {
                                                                                    const perms = data.permissions || [];
                                                                                    setPermissions(perms);
                                                                                    // Mettre à jour le rôle courant si nécessaire
                                                                                    const currentUserPerm = perms.find((perm: any) => perm.user.id === connectedUserId);
                                                                                    setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                                                                                }
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
                                                                    <button
                                                                        className="ml-2 text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded transition-colors"
                                                                        title="Retirer l'accès à la note"
                                                                        disabled={item.user.id === connectedUserId}
                                                                        style={item.user.id === connectedUserId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                                        onClick={async () => {
                                                                            if (item.user.id === connectedUserId) return;
                                                                            if (window.confirm(`Retirer ${item.user.pseudo} de la note ?`)) {
                                                                                const result = await RemovePermission(noteId, item.user.id);
                                                                                if (result.success) {
                                                                                    // Refresh permissions
                                                                                    const data = await FetchPermission(noteId);
                                                                                    if (data.success) {
                                                                                        const perms = data.permissions || [];
                                                                                        setPermissions(perms);
                                                                                        // Mettre à jour le rôle courant si nécessaire
                                                                                        const currentUserPerm = perms.find((perm: any) => perm.user.id === connectedUserId);
                                                                                        setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                                                                                    }
                                                                                } else {
                                                                                    alert(result.error || 'Erreur lors de la suppression');
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        Retirer
                                                                    </button>
                                                                </>
                                                            )}
                                                            {/* Afficher seulement le rôle si l'utilisateur n'a pas les permissions de modification */}
                                                            {(currentUserRole === null || currentUserRole > 1) && role > 0 && (
                                                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                                                    {ROLE_LABELS[item.role]}
                                                                </span>
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

                        {/* Section d'ajout d'utilisateur - seulement pour propriétaire et admin */}
                        {currentUserRole !== null && currentUserRole <= 1 && (
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
                                            if (data.success) {
                                                const perms = data.permissions || [];
                                                setPermissions(perms);
                                                // Mettre à jour le rôle courant si nécessaire
                                                const currentUserPerm = perms.find((perm: any) => perm.user.id === connectedUserId);
                                                setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                                            }
                                        } else {
                                            alert(result.error || 'Erreur lors de l\'ajout');
                                        }
                                    }}
                                    className="w-full bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-hover transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        )}
                        
                        {/* Message pour les utilisateurs sans permissions de gestion */}
                        {currentUserRole !== null && currentUserRole > 1 && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
                                <p className="text-sm text-gray-600">
                                    {currentUserRole === 2 ? "Vous pouvez modifier cette note mais pas gérer les permissions." : 
                                     "Vous avez un accès en lecture seule à cette note."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}