'use client'

import { useState } from "react";
import Icon from "../../../ui/Icon";

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const togglePasswordVisibility = () => setShowPassword((v) => !v);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
        } else {
            setError("");
            // Submit logic here
        }
    };

    return (
        <div className="h-screen p-2.5 flex flex-col justify-center items-center">
            <div className="p-5 flex flex-col justify-center items-start gap-8 w-full max-w-sm">
                <h1 className="w-full text-center justify-center text-primary text-3xl font-bold font-geo">
                    Nouveau mot de passe
                </h1>

                <div className="self-stretch h-0 outline-[5px] outline-offset-[-2.50px] outline-primary" />

                <form className="w-full flex flex-col justify-center items-start gap-2.5" onSubmit={handleSubmit}>
                    <p className="justify-center text-black text-sm font-normal font-gant">
                        Veuillez saisir votre nouveau mot de passe.
                    </p>

                    <div className="w-full p-2.5 bg-white rounded-[10px] flex justify-between items-center">
                        <div className="flex justify-center items-center gap-2.5">
                            <Icon name="keyhole" className="text-zinc-500" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                placeholder="Nouveau mot de passe"
                                required
                                className="flex-1 bg-transparent text-black text-sm font-normal font-gant outline-none"
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                            <Icon
                                name={showPassword ? "eye-close" : "eye"}
                                className="text-zinc-500 hover:text-zinc-700"
                                size={16}
                            />
                        </button>
                    </div>

                    <div className="w-full p-2.5 bg-white rounded-[10px] flex justify-between items-center">
                        <div className="flex justify-center items-center gap-2.5">
                            <Icon name="keyhole" className="text-zinc-500" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Confirmer le mot de passe"
                                required
                                className="flex-1 bg-transparent text-black text-sm font-normal font-gant outline-none"
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    setError("");
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                            <Icon
                                name={showPassword ? "eye-close" : "eye"}
                                className="text-zinc-500 hover:text-zinc-700"
                                size={16}
                            />
                        </button>
                    </div>

                    {error && (
                        <div className="w-full p-2.5 bg-red-100 border border-red-400 text-red-700 rounded-[10px] text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="p-2.5 w-full bg-primary hover:bg-primary/80 active:bg-primary/80 rounded-[10px] flex justify-between items-center shadow-md cursor-pointer transition-colors"
                    >
                        <p className="flex-1 text-center justify-center text-white text-xl font-bold font-gant pointer-events-none">
                            Modifier le mot de passe
                        </p>
                        <Icon name="arrow-barre" className="text-white pointer-events-none" size={40} />
                    </button>
                </form>
            </div>
        </div>
    );
}
