import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";

export default function AccountSupprSuccess() {
    const [countdown, setCountdown] = useState(10);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Rediriger quand le countdown atteint 0
                    router.push('/');
                    window.location.reload(); // Forcer le rechargement de la page
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Nettoyage du timer
        return () => clearInterval(timer);
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-background bg-opacity-95 backdrop-blur-sm z-[200] p-4"
        >
            <div className="bg-clrsecondaire p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <Icon
                            name="check"
                            size={32}
                            className="text-white bg-primary rounded-full p-4"
                        />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-4 text-primary font-gant">Compte marqué pour suppression</h1>
                <p className="text-clrprincipal mb-6 font-geo">
                    Votre compte sera définitivement supprimé dans 1 minute.
                    <br />
                    <span className="text-sm text-element mt-2 block">
                        Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                    </span>
                </p>
                <Link
                    href="/login"
                    className="inline-block bg-primary text-clrsecondaire px-6 py-2 rounded hover:bg-primary-hover transition-all duration-300 font-gant font-medium"
                >
                    Retour a la page de connexion
                </Link>
            </div>
        </motion.div>
    );
}