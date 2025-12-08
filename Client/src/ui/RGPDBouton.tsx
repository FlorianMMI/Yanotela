import { Setup2FA } from "@/loader/loader";

export default function RGPDBouton() {
    return (
        <button
            onClick={() => {
                Setup2FA();
            }}
            className="w-full px-4 py-2 border-2 border-primary text-primary rounded hover:bg-primary-hover hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
            Récupérer mes données
        </button>
    )
}
