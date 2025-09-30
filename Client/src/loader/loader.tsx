import { Note } from '@/type/Note';
import { create } from 'domain';
import { ID } from 'yjs';

const safeApiUrl = 'http://localhost:3001';

export async function CreateNote(noteData?: Partial<Note>): Promise<{ note: Note | null; redirectUrl?: string }> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        const response = await fetch(`${apiUrl}/note/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                Titre: "Sans titre",
                Content: "Sans Contenu"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Réponse de l'API :", data);
        return { note: data.note, redirectUrl: data.redirectUrl };
    } catch (error) {
        console.error("Error creating note:", error);
        return { note: null };
    }
}

export async function GetNotes(): Promise<{ notes: Note[]; }> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;

        console.log('API URL for GetNotes:', apiUrl); // Pour debug

        const response = await fetch(`${apiUrl}/note/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notes = await response.json();
        console.log('Notes from server:', notes);

        // // Calculate total notes based on the length of the notes array
        // const totalNotes = Array.isArray(notes) ? notes.length : 0;

        // Transformation du JSON stringifié en objet lisible
        for (const note of notes) {
            try {
                const parsedContent = JSON.parse(note.Content);
                if (typeof parsedContent === 'object' && parsedContent !== null) {
                    // Si c'est un objet Lexical, extraire le texte
                    if (parsedContent.root && parsedContent.root.children) {
                        // Extraction du texte depuis la structure Lexical
                        const extractText = (children: any[]): string => {
                            return children.map((child: any) => {
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
                console.warn(`Invalid JSON content for note ID ${note.id}, keeping original content.`);
                note.Content = String(note.Content);
            }
        }

        return { notes };
    } catch (error) {
        console.error("Error fetching notes:", error);
        return { notes: [] };
    }
}

export async function GetNoteById(id: string): Promise<Note | null> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        console.log('API URL for GetNoteById:', apiUrl); // Pour debug
        const response = await fetch(`${apiUrl}/note/get/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const note = await response.json();
        console.log('Note from server:', note);
        return note;
    } catch (error) {
        console.error("Error fetching note by ID:", error);
        return null;
    }
}

export async function SaveNote(id: string, noteData: Partial<Note>): Promise<boolean> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        console.log('API URL for SaveNote:', apiUrl);
        const response = await fetch(`${apiUrl}/note/update/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(noteData),
            credentials: 'include'
        });
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
}

interface AuthResponse {
    success: boolean;
    message?: string;
    error?: string;
    errors?: Array<{ msg: string }>;
}

export async function Login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', 
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            return { success: true, message: 'Connexion réussie' };
        } else {
            const errorData = await response.text();
            return { success: false, error: 'Identifiants incorrects' };
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function Register(userData: RegisterData): Promise<AuthResponse> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        const response = await fetch(`${apiUrl}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(userData),
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        const response = await fetch(`${apiUrl}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return { success: true, message: 'Un lien de réinitialisation a été envoyé à votre adresse email.' };
        } else {
            return { success: false, error: data.error || 'Erreur lors de l\'envoi du lien de réinitialisation' };
        }
    } catch (error) {
        console.error('Erreur:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

export async function ResetPassword(token: string, password: string): Promise<AuthResponse> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        const response = await fetch(`${apiUrl}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password, token }),
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        const response = await fetch(`${apiUrl}/reset-password/${token}`);
        const data = await response.json();
        
        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: "Token invalide ou expiré" };
        }
    } catch (error) {
        return { success: false, error: "Erreur de connexion au serveur" };
    }
}

export async function Logout(): Promise<AuthResponse> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
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
    };
}

export async function InfoUser(): Promise<InfoUserResponse> {
    console.log('🔍 InfoUser: Début de la requête');
    
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        console.log('🔍 InfoUser: URL API:', apiUrl);
        
        const response = await fetch(`${apiUrl}/user/info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        console.log('🔍 InfoUser: Statut de la réponse:', response.status);

        if (response.ok) {
            const userData = await response.json();
            console.log('🔍 InfoUser: Données reçues:', userData);
            return { success: true, message: 'Informations utilisateur récupérées', user: userData };
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('🔍 InfoUser: Erreur de réponse:', errorData);
            return { success: false, error: errorData.message || 'Erreur lors de la récupération des informations utilisateur' };
        }
    } catch (error) {
        console.error('🔍 InfoUser: Erreur de connexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}