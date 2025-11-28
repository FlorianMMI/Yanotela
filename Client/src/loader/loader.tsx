import { Note } from '@/type/Note';
import { Folder } from '@/type/Folder';
import { Permission } from '@/type/Permission';
import { checkAuthResponse } from '@/utils/authFetch';

function getApiUrl() {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return '';
}

function getTurnstileToken() {
    if (typeof window === 'undefined') return undefined;
    const el = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    return el?.value;
}

/**
 * Vérifie si la réponse est un 401 et déclenche la redirection si nécessaire
 * @returns true si la réponse est OK ou non-401, false si 401 (redirection déclenchée)
 */
function handleAuthError(response: Response): boolean {
    return checkAuthResponse(response);
}

const apiUrl = getApiUrl();

export async function CreateNote(): Promise<{ note: Note | null; redirectUrl?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                Titre: "Sans titre",
                Content: "",
            })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { note: null };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { note: data.note, redirectUrl: data.redirectUrl };
    } catch (error) {
        console.error("Error creating note:", error);
        return { note: null };
    }
}

export async function GetNotes(): Promise<{ notes: Note[]; totalNotes: number }> {
    try {
        const response = await fetch(`${apiUrl}/note/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { notes: [], totalNotes: 0 };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Vérification que les données attendues sont présentes
        if (!data.notes || typeof data.totalNotes === 'undefined') {
            console.error('Invalid response format - missing notes or totalNotes:', data);
            return { notes: [], totalNotes: 0 };
        }

        // Transformation du JSON stringifié en objet lisible
        for (const note of data.notes) {
            try {
                // ✅ Vérifier d'abord si c'est déjà un objet ou une string
                let parsedContent;
                
                if (typeof note.Content === 'string') {
                    // Si c'est une string, essayer de parser
                    parsedContent = JSON.parse(note.Content);
                } else if (typeof note.Content === 'object' && note.Content !== null) {
                    // Si c'est déjà un objet, l'utiliser directement
                    parsedContent = note.Content;
                } else {
                    // Si c'est null ou undefined
                    note.Content = 'Contenu vide';
                    continue;
                }
                
                // Si c'est un objet Lexical, extraire le texte
                if (parsedContent.root && parsedContent.root.children) {
                    // Extraction récursive du texte depuis la structure Lexical (gère tous les nœuds)
                    interface LexicalNode {
                        type?: string;
                        text?: string;
                        children?: LexicalNode[];
                    }
                    
                    const extractText = (node: LexicalNode): string => {
                        if (!node) return '';
                        
                        // Si c'est un nœud texte
                        if (node.type === 'text' && node.text) {
                            return node.text;
                        }
                        
                        // Si c'est un nœud avec enfants (paragraph, heading, list, etc.)
                        if (node.children && Array.isArray(node.children)) {
                            return node.children.map((child: LexicalNode) => extractText(child)).join(' ');
                        }
                        
                        // Si c'est un nœud image ou autre sans texte
                        if (node.type === 'image') {
                            return '[Image]';
                        }
                        
                        return '';
                    };
                    
                    const textContent = extractText(parsedContent.root).trim();
                    note.Content = textContent || 'Contenu vide';
                } else {
                    // Si c'est un autre type d'objet, convertir en string lisible
                    note.Content = JSON.stringify(parsedContent).substring(0, 100) + '...';
                }
            } catch (error) {
                void error;
                // Si le parsing échoue, garder le contenu tel quel ou afficher le début
                const content = String(note.Content);
                note.Content = content.length > 100 ? content.substring(0, 100) + '...' : content;
            }
        }

        return { notes: data.notes, totalNotes: data.totalNotes };
    } catch (error) {
        console.error("Error fetching notes:", error);
        return { notes: [], totalNotes: 0 };
    }
}

export async function GetNoteById(id: string): Promise<Note | { error: string } | null> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const response = await fetch(`${apiUrl}/note/get/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { error: 'Session expirée' };
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            // Return backend error message if present
            return { error: data.message || `HTTP error! status: ${response.status}` };
        }
        return data;
    } catch (error) {
        console.error("Error fetching note by ID:", error);
        return { error: "Erreur de connexion au serveur" };
    }
}

export async function SaveNote(id: string, noteData: Partial<Note>): Promise<boolean> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const response = await fetch(`${apiUrl}/note/update/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(noteData),
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return false;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    }
    catch (error) {
        console.error("Error saving note:", error);
        return false;
    }
}

export async function DeleteNote(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/delete/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.message || "Note supprimée avec succès"
        };
    } catch (error) {
        console.error("Error deleting note:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

export async function DuplicateNote(id: string): Promise<{ success: boolean; note?: Note; redirectUrl?: string; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/duplicate/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            note: data.note,
            redirectUrl: data.redirectUrl,
            message: data.message || "Note dupliquée avec succès"
        };
    } catch (error) {
        console.error("Error duplicating note:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

export async function LeaveNote(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/leave/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.message || "Vous avez quitté la note avec succès"
        };
    } catch (error) {
        console.error("Error leaving note:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

export async function GetDeletedNotes(): Promise<{ notes: Note[]; totalNotes: number }> {
    try {
        const response = await fetch(`${apiUrl}/note/deleted`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { notes: [], totalNotes: 0 };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.notes || typeof data.totalNotes === 'undefined') {
            console.error('Invalid response format - missing notes or totalNotes:', data);
            return { notes: [], totalNotes: 0 };
        }

        // Transformation du JSON stringifié en objet lisible
        for (const note of data.notes) {
            try {
                const parsedContent = JSON.parse(note.Content);
                if (typeof parsedContent === 'object' && parsedContent !== null) {
                    if (parsedContent.root && parsedContent.root.children) {
                        const extractText = (children: Array<{ type?: string; children?: unknown[]; text?: string }>): string => {
                            return children.map((child: { type?: string; children?: unknown[]; text?: string }) => {
                                if (child.type === 'paragraph' && child.children) {
                                    return extractText(child.children as Array<{ type?: string; children?: unknown[]; text?: string }>);
                                } else if (child.type === 'text' && child.text) {
                                    return child.text;
                                }
                                return '';
                            }).join(' ');
                        };
                        note.Content = extractText(parsedContent.root.children) || 'Contenu vide';
                    } else {
                        note.Content = JSON.stringify(parsedContent);
                    }
                }
            } catch {
                
                note.Content = String(note.Content);
            }
        }

        return { notes: data.notes, totalNotes: data.totalNotes };
    } catch (error) {
        console.error("Error fetching deleted notes:", error);
        return { notes: [], totalNotes: 0 };
    }
}

export async function RestoreNote(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/restore/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.message || "Note restaurée avec succès"
        };
    } catch (error) {
        console.error("Error restoring note:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

export async function setPublic(noteId: string, isPublic: boolean): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/set-public/${noteId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ isPublic })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            message: data.message || "Statut public modifié avec succès"
        };
    } catch (error) {
        console.error("Error setting note public status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

export async function IsPublic(noteId: string): Promise<{ success: boolean; isPublic?: boolean; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/is-public/${noteId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.message || `Erreur HTTP ${response.status}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            isPublic: data.isPublic
        };
    } catch (error) {
        console.error("Error checking if note is public:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
}

// ============== AUTHENTIFICATION FUNCTIONS ==============

interface LoginCredentials {
    identifiant: string; // email ou pseudo
    password: string;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    pseudo: string;
    email: string;
    password: string;
    checkedCGU: boolean;
}

interface AuthResponse {
    success: boolean;
    message?: string;
    error?: string;
    errors?: Array<{ msg: string }>;
    theme?: string; // Thème de l'utilisateur
}

export async function Login(credentials: LoginCredentials): Promise<AuthResponse> {

    try {
        
        const apiUrl = getApiUrl();
        const token = getTurnstileToken();
        const body = { ...credentials } as any;
        if (token) body['cf-turnstile-response'] = token;

        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', 
            body: JSON.stringify(body)
        });

        if (response.ok) {
            // Récupérer les informations utilisateur pour obtenir le thème
            try {
                const userInfoResponse = await fetch(`${apiUrl}/user/info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (userInfoResponse.ok) {
                    const userData = await userInfoResponse.json();
                    return { 
                        success: true, 
                        message: 'Connexion réussie',
                        theme: userData.theme 
                    };
                }
            } catch (userInfoError) {
                console.error('Erreur lors de la récupération du thème:', userInfoError);
            }
            
            return { success: true, message: 'Connexion réussie' };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Erreur lors de la connexion' };
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function Register(userData: RegisterData): Promise<AuthResponse> {
    try {
        
        const apiUrl = getApiUrl();
        const token = getTurnstileToken();
        const payload = { ...userData } as any;
        if (token) payload['cf-turnstile-response'] = token;

        const response = await fetch(`${apiUrl}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        // Vérifier si la réponse est du JSON
        const contentType = response.headers.get("content-type");
        let responseData;

        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            // Si ce n'est pas du JSON, lire comme texte
            const textResponse = await response.text();
            console.error("Réponse non-JSON reçue:", textResponse);
            return { success: false, error: "Le serveur a renvoyé une réponse inattendue" };
        }

        if (response.ok) {
            return { success: true, message: responseData.message };
        } else {
            if (responseData.errors) {
                // Gérer les erreurs de validation
                const errorMessages = responseData.errors
                    .map((err: { msg: string }) => err.msg)
                    .join(", ");
                return { success: false, error: errorMessages };
            } else {
                return { success: false, error: responseData.error || "Erreur lors de l'inscription" };
            }
        }
    } catch (error) {
        console.error("Erreur d'inscription:", error);
        return { success: false, error: "Erreur de connexion au serveur: " + (error as Error).message };
    }
}

export async function ForgotPassword(email: string): Promise<AuthResponse> {
    try {
        
        const apiUrl = getApiUrl();
        const token = getTurnstileToken();
        const payload: any = { email };
        if (token) payload['cf-turnstile-response'] = token;

        const response = await fetch(`${apiUrl}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return { success: true, message: 'Si votre adresse email est valide, vous recevrez un email de réinitialisation' };
        } else {
            return { success: true, message: 'Si votre adresse email est valide, vous recevrez un email de réinitialisation' };
        }
    } catch (error) {
        console.error('Erreur:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function ResetPassword(token: string, password: string): Promise<AuthResponse> {
    try {
        
        const apiUrl = getApiUrl();
        const tokenVal = getTurnstileToken();
        const payload: any = { password, token };
        if (tokenVal) payload['cf-turnstile-response'] = tokenVal;

        const response = await fetch(`${apiUrl}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return { success: true, message: 'Mot de passe réinitialisé avec succès.' };
        } else {
            return { success: false, error: data.error || 'Erreur lors de la réinitialisation du mot de passe' };
        }
    } catch (error) {
        console.error('Erreur:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function ValidateResetToken(token: string): Promise<AuthResponse> {
    try {
        
        const response = await fetch(`${apiUrl}/reset-password/${token}`);
        
        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: "Token invalide ou expiré" };
        }
    } catch (error) {
        return { success: false, error: "Erreur de connexion au serveur :" + (error as Error).message};
    }
}

export async function Logout(): Promise<AuthResponse> {
    try {
        
        const response = await fetch(`${apiUrl}/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            return { success: true, message: 'Déconnexion réussie' };
        } else {
            return { success: false, error: 'Erreur lors de la déconnexion' };
        }
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// ============== USER  FUNCTION ==============

interface InfoUserResponse {
    success: boolean;
    message?: string;
    error?: string;
    user?: {
        id: number;
        pseudo: string;
        prenom?: string;
        nom?: string;
        email: string;
        noteCount?: number; // Nombre de notes de l'utilisateur
        theme?: string; // Thème de l'utilisateur
    };
}

export async function InfoUser(): Promise<InfoUserResponse> {
    
    try {
        
        const response = await fetch(`${apiUrl}/user/info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const userData = await response.json();
            return { success: true, user: userData };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Erreur lors de la récupération des informations utilisateur' };
        }
    } catch (error) {
        console.error('Erreur InfoUser:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// ============== SUPPRESSION DE COMPTE ==============

interface DeleteAccountResponse {
    success: boolean;
    message?: string;
    error?: string;
    deletionDate?: string;
    canCancel?: boolean;
}

export async function DeleteAccount(reason?: string): Promise<DeleteAccountResponse> {
    try {
        
        const response = await fetch(`${apiUrl}/user/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ reason })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        const data = await response.json();

        if (response.ok) {
            return { 
                success: true, 
                message: data.message,
                deletionDate: data.deletionDate,
                canCancel: data.canCancel
            };
        } else {
            return { success: false, error: data.message || 'Erreur lors de la suppression du compte' };
        }
    } catch (error) {
        console.error('Erreur DeleteAccount:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function CancelAccountDeletion(): Promise<AuthResponse> {
    try {

        const response = await fetch(`${apiUrl}/user/cancel-deletion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.message || 'Erreur lors de l\'annulation de la suppression' };
        }
    } catch (error) {
        console.error('Erreur CancelAccountDeletion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function updateUser(data: { prenom?: string; nom?: string; pseudo?: string; email?: string; password?: string; newPassword?: string; }): Promise<AuthResponse> {
    try {

        const response = await fetch(`${apiUrl}/user/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }
        
        if (response.ok) {
            const responseData = await response.json();
            return { success: true, message: responseData.message || 'Informations utilisateur mises à jour avec succès' };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de la mise à jour des informations utilisateur' };
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function FetchPermission(noteId: string): Promise<{ success: boolean; permissions?: Permission[]; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/permission/note/${noteId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json();
            return { success: true, permissions: data.permissions };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors de la récupération des permissions' };
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function UpdatePermission(noteId: string, userId: number, newRole: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/permission/update/${noteId}/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ newRole })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de la modification du rôle' };
        }
    } catch (error) {
        console.error('Erreur lors de la modification du rôle:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function AddPermission(noteId: string, identifier: string, role: number = 3): Promise<{ success: boolean; message?: string; user?: { id: number; pseudo: string; email: string }; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/permission/add/${noteId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ identifier, role })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message, user: data.user };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de l\'ajout de l\'utilisateur' };
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function RemovePermission(noteId: string, userId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/permission/${noteId}/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de la suppression de la permission' };
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la permission:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// ============== NOTIFICATION  FUNCTIONS ==============

interface NotificationNote {
    id: string;
    Titre: string;
    role: number;
    isAccepted: boolean;
    author?: {
        pseudo: string;
    };
}

export async function GetNotifications(): Promise<{ success: boolean; notes?: NotificationNote[]; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/notification/get`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: true, notes: data.notes || [] };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors de la récupération des notifications' };
        }
    } catch (error) {
        console.error('Erreur GetNotifications:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function AcceptNotification(invitationId: string): Promise<{ success: boolean; message?: string; error?: string; noteId?: string }> {
    try {
        const response = await fetch(`${apiUrl}/notification/accept/${invitationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: true, message: data.message, noteId: data.noteId };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de l\'acceptation de l\'invitation' };
        }
    } catch (error) {
        console.error('Erreur AcceptNotification:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function RefuseNotification(invitationId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/notification/refuse/${invitationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { success: true, message: data.message };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors du refus de l\'invitation' };
        }
    } catch (error) {
        console.error('Erreur RefuseNotification:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// ============== FOLDER  FUNCTIONS ==============

export async function GetFolders(): Promise<{ folders: Folder[]; totalFolders: number }> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { folders: [], totalFolders: 0 };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { 
            folders: data.folders || [], 
            totalFolders: data.totalFolders || 0 
        };
    } catch (error) {
        console.error("Error loading folders:", error);
        return { folders: [], totalFolders: 0 };
    }
}

export async function GetFolderById(id: string): Promise<{ folder: Folder | null; notes?: Note[]; error?: string } | null> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/get/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { folder: null, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { folder: null, error: errorData.error || 'Dossier introuvable' };
        }

        const data: { folder: Folder; notes?: Note[] } = await response.json();
        
        // Transformation du JSON stringifié en objet lisible (même traitement que GetNotes)
        if (data.notes && Array.isArray(data.notes)) {
            for (const note of data.notes) {
                try {
                    const parsedContent = JSON.parse(note.Content);
                    if (typeof parsedContent === 'object' && parsedContent !== null) {
                        // Si c'est un objet Lexical, extraire le texte
                        if (parsedContent.root && parsedContent.root.children) {
                            // Extraction du texte depuis la structure Lexical
                            interface LexicalNode {
                                type?: string;
                                text?: string;
                                children?: LexicalNode[];
                            }
                            
                            const extractText = (children: LexicalNode[]): string => {
                                return children.map((child: LexicalNode) => {
                                    if (child.type === 'paragraph' && child.children) {
                                        return extractText(child.children);
                                    } else if (child.type === 'text' && child.text) {
                                        return child.text;
                                    }
                                    return '';
                                }).join(' ');
                            };
                            note.Content = extractText(parsedContent.root.children) || 'Contenu vide';
                        } else {
                            // Si c'est un autre type d'objet, convertir en string lisible
                            note.Content = JSON.stringify(parsedContent);
                        }
                    }
                } catch {
                    // Si le parsing échoue, garder le contenu tel quel
                    
                    note.Content = String(note.Content);
                }
            }
        }
        
        return { folder: data.folder, notes: data.notes || [] };
    } catch (error) {
        console.error("Error loading folder:", error);
        return { folder: null, error: 'Erreur de connexion au serveur' };
    }
}

export async function CreateFolder(folderData?: { Nom?: string; Description?: string; CouleurTag?: string }): Promise<{ folder: Folder | null; redirectUrl?: string }> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                Nom: folderData?.Nom || "Nouveau dossier",
                Description: folderData?.Description || "",
                CouleurTag: folderData?.CouleurTag || "#882626",
            })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { folder: null };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Error creating folder:", errorData);
            return { folder: null };
        }

        const data = await response.json();
        return { 
            folder: data.folder, 
            redirectUrl: `/dossiers/${data.folder.id}` 
        };
    } catch (error) {
        console.error("Error creating folder:", error);
        return { folder: null };
    }
}

export async function UpdateFolder(id: string, folderData: { Nom?: string; Description?: string; CouleurTag?: string }): Promise<{ success: boolean; folder?: Folder; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/update/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify(folderData)
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de la mise à jour du dossier' };
        }

        const data = await response.json();
        return { success: true, folder: data.folder };
    } catch (error) {
        console.error("Error updating folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function DeleteFolder(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/delete/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de la suppression du dossier' };
        }

        const data = await response.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error deleting folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// ============== NOTE FOLDER FUNCTIONS ==============

export async function AddNoteToFolder(noteId: string, folderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/dossiers/add-note`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ noteId, dossierId: folderId })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Erreur lors de l\'ajout de la note au dossier' };
        }

        const data = await response.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error adding note to folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function AssignNoteToFolder(noteId: string, folderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/assign-folder/${noteId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ folderId })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors de l\'assignation de la note au dossier' };
        }

        const data = await response.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error assigning note to folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function RemoveNoteFromFolder(noteId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/remove-folder/${noteId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors du retrait de la note du dossier' };
        }

        const data = await response.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error removing note from folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function GetNoteFolder(noteId: string): Promise<{ success: boolean; folder?: Folder; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/folder/${noteId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors de la récupération du dossier de la note' };
        }

        const data = await response.json();
        return { success: true, folder: data.folder };
    } catch (error) {
        console.error("Error getting note folder:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// Mettre à jour le tag d'une note
export async function UpdateNoteTag(noteId: string, tag: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${apiUrl}/note/tag/${noteId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ tag })
        });

        // Vérifier si session expirée (401)
        if (!handleAuthError(response)) {
            return { success: false, error: 'Session expirée' };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Erreur lors de la mise à jour du tag' };
        }

        const data = await response.json();
        return { success: true, message: data.message || 'Tag mis à jour avec succès' };
    } catch (error) {
        console.error("Error updating note tag:", error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

