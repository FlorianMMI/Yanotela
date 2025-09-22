import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    
    <>
      {/* Bouton de redirection vers la page de login */}
      <div className="p-2.5 w-full h-screen flex justify-center items-center">
        <Link href="/login">
          <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-[10px] text-white text-lg font-bold font-['Gantari'] transition-colors">
            Aller a la page de connexion
          </button>
        </Link>
      </div>
    </>
  );
}
