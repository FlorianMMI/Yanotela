import { Setup2FA } from "@/loader/loader";

export default function RGPDBouton() {


        return (
            <>

                <div className="p-4 bg-white rounded shadow-md">
                    
                    <h2 className="text-xl font-bold mb-4">Recupérer mes données</h2>
                    <button
                        onClick={() => {
                            Setup2FA();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                    >
                        Récupérer mes données
                    </button>
                </div>
            </>
        )




}