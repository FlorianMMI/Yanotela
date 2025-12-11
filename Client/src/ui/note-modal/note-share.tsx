import React, { useState, useEffect } from "react";
import { FetchPermission, UpdatePermission, AddPermission, RemovePermission, IsPublic, setPublic } from "@/loader/loader";
import { Permission } from "@/type/Permission";
import { useAuth } from "@/hooks/useAuth";
import { CheckIcon, CopyIcon, CopyLinkIcon, CrownIcon } from '@/libs/Icons';
import ConfirmRemoveUserModal from "./ConfirmRemoveUserModal";

const ROLE_LABELS = ["Propriétaire", "Administrateur", "Éditeur", "Lecteur"];

interface NoteShareUIProps {
    noteId: string;
    onShareSuccess?: () => void;
}

const NoteShareUI: React.FC<NoteShareUIProps> = ({ noteId, onShareSuccess }) => {
    const auth = useAuth();
    const connectedUserId = auth.user?.id;

    const [permissions, setPermissions] = useState<{ user: { pseudo: string, email: string, id: number }, role: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUserIdentifier, setNewUserIdentifier] = useState("");
    const [selectedRole, setSelectedRole] = useState(3); // Par défaut: Lecteur
    const [isTogglePublic, setIsTogglePublic] = useState(false); // false = privé par défaut
    const [copied, setCopied] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<number | null>(null); // Rôle de l'utilisateur connecté
    const [userToRemove, setUserToRemove] = useState<{ id: number; pseudo: string } | null>(null);

    useEffect(() => {
        setLoading(true);
        // Récupérer les permissions
        FetchPermission(noteId).then((data) => {
            const perms = data && data.success && Array.isArray(data.permissions) ? data.permissions : [];
            setPermissions(perms);
            // Trouver le rôle de l'utilisateur connecté
            const currentUserPerm = perms.find((perm) => perm.user.id === connectedUserId);
            setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
            setLoading(false);
        });

        // Récupérer le statut public/privé
        IsPublic(noteId).then((data) => {
            if (data.success && typeof data.isPublic === 'boolean') {
                setIsTogglePublic(data.isPublic);
            }
        });
    }, [noteId, connectedUserId]);

    const handleTogglePublic = async (newValue: boolean) => {
        setIsTogglePublic(newValue);
        const result = await setPublic(noteId, newValue);
        if (!result.success) {
            // Revenir à l'état précédent en cas d'erreur
            setIsTogglePublic(!newValue);
            alert(result.error || 'Erreur lors de la modification du statut');
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {
                <>
                    <section className="flex justify-between items-center mb-4">
                        <div className={` px-3 py-1 rounded-full text-sm inline-block ${currentUserRole === 0 ? 'bg-deskbackground text-primary' : 'bg-deskbackground text-element'}`}>
                            {(() => {
                                const label = (typeof currentUserRole === 'number' && ROLE_LABELS[currentUserRole]) ? ROLE_LABELS[currentUserRole] : null;
                                return (
                                    <span>Vous êtes {label ? label.toLowerCase() : 'utilisateur'}</span>
                                );
                            })()}
                        </div>

                        <div>
                            <label className="flex items-center gap-3">
                                {isTogglePublic ? (
                                    <span className="text-sm text-element">Publique</span>
                                ) : (
                                    <span className="text-sm text-element">Privée</span>
                                )}
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        aria-label="Basculer public/privé"
                                        checked={isTogglePublic}
                                        onChange={(e) => {
                                            handleTogglePublic(e.target.checked);
                                        }}
                                    />
                                    <div className="w-11 h-6 rounded-full bg-deskbackground peer-checked:bg-primary transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5" />
                                </div>
                            </label>
                        </div>
                    </section>
                </>
            }

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
                                            <div className="min-w-0 shrink overflow-hidden">
                                                <div className="font-medium text-sm text-foreground truncate">
                                                    {item.user.pseudo}
                                                </div>
                                                <div className="text-xs text-element truncate">
                                                    <span className="hidden sm:inline">
                                                        {item.user.email.length > 25 ? `${item.user.email.substring(0, 25)}...` : item.user.email}
                                                    </span>
                                                    <span className="inline sm:hidden">
                                                        {item.user.email.length > 15 ? `${item.user.email.substring(0, 15)}...` : item.user.email}
                                                    </span>
                                                </div>
                                            </div>
                                            {role === 0 && (
                                                <CrownIcon width={20} height={20} className="text-yellow-500" />
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
                                                                    const currentUserPerm = perms.find((perm) => perm.user.id === connectedUserId);
                                                                    setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                                                                }
                                                                // Appeler le callback pour rafraîchir la liste des notes
                                                                if (onShareSuccess) {
                                                                    onShareSuccess();
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
                                                        onClick={() => {
                                                            if (item.user.id === connectedUserId) return;
                                                            setUserToRemove({ id: item.user.id, pseudo: item.user.pseudo });
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
                    <div className="flex gap-2">
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
                                        const currentUserPerm = perms.find((perm) => perm.user.id === connectedUserId);
                                        setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                                    }
                                    // Appeler le callback pour rafraîchir la liste des notes
                                    if (onShareSuccess) {
                                        onShareSuccess();
                                    }
                                } else {
                                    alert(result.error || 'Erreur lors de l\'ajout');
                                }
                            }}
                            className="flex-1 bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-hover transition-colors"
                        >
                            Ajouter
                        </button>

                        <button
                            onClick={async () => {

                                try {
                                    const url = `${window.location.origin}/notes/${noteId}`;
                                    await navigator.clipboard.writeText(url);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                } catch (err) {
                                    console.error('Erreur copie lien', err);
                                    alert('Impossible de copier le lien.');
                                }
                            }}

                            title="Copier le lien de la note"
                            className={`px-4 py-2 border border-element rounded text-sm text-foreground flex flex-col justify-center hover:bg-deskbackground transition-colors`}
                        >
                            {copied ? <CopyIcon width={20} height={20} /> : <CopyLinkIcon />}
                        </button>
                    </div>
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

            {/* Modale de confirmation de suppression */}
            <ConfirmRemoveUserModal
                isOpen={userToRemove !== null}
                onClose={() => setUserToRemove(null)}
                onConfirm={async () => {
                    if (!userToRemove) return;
                    const result = await RemovePermission(noteId, userToRemove.id);
                    if (result.success) {
                        // Refresh permissions
                        const data = await FetchPermission(noteId);
                        if (data.success) {
                            const perms = data.permissions || [];
                            setPermissions(perms);
                            // Mettre à jour le rôle courant si nécessaire
                            const currentUserPerm = perms.find((perm) => perm.user.id === connectedUserId);
                            setCurrentUserRole(currentUserPerm ? currentUserPerm.role : null);
                        }
                        // Appeler le callback pour rafraîchir la liste des notes
                        if (onShareSuccess) {
                            onShareSuccess();
                        }
                    } else {
                        alert(result.error || 'Erreur lors de la suppression');
                    }
                }}
                userName={userToRemove?.pseudo || ""}
            />
        </div>
    );
};

export default NoteShareUI;
