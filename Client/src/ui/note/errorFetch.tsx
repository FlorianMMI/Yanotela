"use client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { connect } from "http2";

type ErrorFetchProps = {
    type?: "fetch" | "save" | "connect";
};

const errorMessages = {
    fetch: {
        title: "Erreur de Récupération ",
        message: "Une erreur est survenue lors de la récupération de la note.",
    },
    save: {
        title: "Erreur de Sauvegarde",
        message: "Nous n'avons pas réussi à sauvegarder la note.",
    },
    connect: {
        title: "Erreur de Connexion",
        message: "Nous n'avons pas réussi à nous connecter à cette note. Vérifiez la validité du lien.",
    },
};

export default function ErrorFetch({ type = "fetch" }: ErrorFetchProps) {
    const router = useRouter();
    const { title, message } = errorMessages[type];

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen w-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="flex flex-col items-center justify-center bg-red-100 border border-red-300 rounded-lg p-6 shadow-sm"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                <motion.h1
                    className="text-2xl font-bold mb-4 text-red-500"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    {title}
                </motion.h1>
                <motion.p
                    className="text-gray-600 w-100 text-center"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    {message}
                </motion.p>
                <motion.button
                    className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-primary transition-colors"
                    onClick={() => router.back()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                >
                    Revenir en arrière
                </motion.button>
            </motion.div>
        </motion.div>
    );
}