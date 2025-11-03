import React, { useState, useEffect } from "react";
import { FetchPermission, UpdatePermission, AddPermission, RemovePermission } from "@/loader/loader";
import { useAuth } from "@/hooks/useAuth";
import Icon from "../Icon";

const ROLE_LABELS = ["Propriétaire", "Administrateur", "Éditeur", "Lecteur"];

interface NoteShareUIProps {
    noteId: string;
}

const NoteShareUI: React.FC<NoteShareUIProps> = ({ noteId }) => {
    const auth = useAuth();
    const connectedUserId = auth.user?.id;

    const [permissions, setPermissions] = useState<{ user: { pseudo: string, email: string, id: number }, role: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUserIdentifier, setNewUserIdentifier] = useState("");
    const [selectedRole, setSelectedRole] = useState(3); // Par défaut: Lecteur
    const [currentUserRole, setCurrentUserRole] = useState<number | null>(null); // Rôle de l'utilisateur connecté

    useEffect(() => {
        setLoading(true);
        FetchPermission(noteId).then((data: any) => {
            const perms = data && data.success && Array.isArray(data.permissions) ? data.permissions : [];
            setPermissions(perms);
            // Trouver le rôle de l'utilisateur connecté
            const currentUserPerm = perms.find((perm: any) => perm.user.id === connectedUserId);
            setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
            setLoading(false);
        });
    }, [noteId, connectedUserId]);

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {currentUserRole !== null && (
                <div className={`mb-4 px-3 py-1 rounded-full text-sm inline-block ${currentUserRole === 0 ? 'bg-deskbackground text-primary' :
                    'bg-deskbackground text-element'
                    }`}>
                    Vous êtes {ROLE_LABELS[currentUserRole].toLowerCase()}
                </div>
            )}

            {loading ? (
                <div className="py-8 text-center text-element">Chargement...</div>
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
                            <div key={label} className="bg-deskbackground rounded-lg p-3">
                                <h4 className="font-medium text-sm text-gray-700 mb-2">{label}</h4>
                                <div className="space-y-2">
                                    {users.map((item) => (
                                        <div key={item.user.id} className="flex items-center justify-between bg-white rounded p-2">
                                            <div>
                                                <div className="font-medium text-sm text-foreground">
                                                    {item.user.pseudo.length > 16 ? `${item.user.pseudo.substring(0, 16)}...` : item.user.pseudo}
                                                </div>
                                                <div className="text-xs text-element">
                                                    {item.user.email.length > 25 ? `${item.user.email.substring(0, 25)}...` : item.user.email}
                                                </div>
                                            </div>
                                            {role === 0 && (
                                                <Icon name="crown" className="text-yellow-500" size={20} />
                                            )}
                                            {/* Afficher les actions seulement si l'utilisateur a les permissions ET ce n'est pas le propriétaire */}
                                            {role > 0 && currentUserRole !== null && currentUserRole <= 1 && (
                                                <div className="flex flex-col gap-2 w-auto">
                                                    <select
                                                        value={item.role}
                                                        disabled={item.user.id === connectedUserId}
                                                        style={item.user.id === connectedUserId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                                                        className="text-xs border border-element rounded px-2 py-1 text-foreground w-full"
                                                    >
                                                        {(currentUserRole !== null && currentUserRole < 1 || item.user.id === connectedUserId) && (
                                                            <option value={1}>Admin</option>
                                                        )}
                                                        <option value={2}>Éditeur</option>
                                                        <option value={3}>Lecteur</option>
                                                    </select>
                                                    <button
                                                        className="text-xs text-primary hover:text-primary-hover px-2 py-1 border border-primary hover:border-primary-hover rounded transition-colors w-full"
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
                                                </div>
                                            )}
                                            {/* Afficher seulement le rôle si l'utilisateur n'a pas les permissions de modification */}
                                            {(currentUserRole === null || currentUserRole > 1) && role > 0 && (
                                                <span className="text-xs text-element px-2 py-1 bg-deskbackground rounded">
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

            {/* Section d'ajout d'utilisateur - seulement pour propriétaire et admin */}
            {currentUserRole !== null && currentUserRole <= 1 && (
                <div className="border-t border-element p-4 mt-4 bg-white">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">Inviter un utilisateur</h4>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Email ou pseudo..."
                            value={newUserIdentifier}
                            onChange={(e) => setNewUserIdentifier(e.target.value)}
                            className="flex-1 px-3 py-2 border border-element rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                        />
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                            className="px-3 py-2 border border-element rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            {(currentUserRole !== null && currentUserRole < 1) && (
                                <option value={1}>Admin</option>
                            )}
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
                <div className="border-t border-element p-4 mt-4 bg-white">
                    <p className="text-sm text-foreground">
                        {currentUserRole === 2 ? "Vous pouvez modifier cette note mais pas gérer les permissions." :
                            "Vous avez un accès en lecture seule à cette note."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NoteShareUI;