'use client';

import { Setup2FA } from "@/loader/loader";
import { useRouter } from "next/navigation";

export default function RGPDBouton() {
    const router = useRouter();

    const handleClick = async () => {
        const result = await Setup2FA();
        if (result.success && result.redirectUrl) {
            router.push(result.redirectUrl);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="w-full px-4 py-2 border-2 border-primary text-primary rounded hover:border-primary-hover hover:text-primary-hover hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
            Récupérer mes données
        </button>
    )
}
