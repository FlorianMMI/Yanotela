import Image from "next/image";

export default function Home() {
  return (
    <div className="h-[717px] p-2.5 inline-flex flex-col justify-between items-start">
      {/* image de fleche */}
    <div className="w-7 h-7 relative">
        <div className="w-3.5 h-6 left-[8.53px] top-[3.14px] absolute bg-black" />
        
    </div>

    {/* Text titre*/}
    <div className="w-80 h-28 text-center justify-center text-red-900 text-4xl font-bold font-['Geologica']">Quel plaisir de vous revoir !</div>
    {/* Text titre*/}
    <div className="self-stretch p-2.5 flex flex-col justify-center items-start gap-2.5 overflow-hidden">
        <div className="self-stretch justify-center text-black text-sm font-normal font-['Gantari']">Veuillez indiquer votre adresse e-mail et votre mot de passe.</div>
        <div data-property-1="Mail" className="w-72 p-2.5 bg-white rounded-[10px] inline-flex justify-start items-center gap-2.5 overflow-hidden">
            <div className="w-5 h-5 relative">
                <div className="w-3.5 h-4 left-[3.33px] top-[1.67px] absolute bg-zinc-500" />
            </div>
            <div className="justify-start text-black text-sm font-normal font-['Gantari']">Votre mail ou pseudonyme</div>
        </div>
        <div data-property-1="MDP" className="w-72 p-2.5 bg-white rounded-[10px] inline-flex justify-between items-center overflow-hidden">
            <div className="flex justify-start items-center gap-2.5">
                <div className="w-5 h-5 relative">
                    <div className="w-4 h-4 left-[1.67px] top-[1.67px] absolute bg-zinc-500" />
                </div>
                <div className="justify-start text-black text-sm font-normal font-['Gantari']">Votre mot de passe</div>
            </div>
            <div data-property-1="Open" className="w-5 h-5 relative">
                <div className="w-5 h-3 left-[0.83px] top-[3.75px] absolute bg-zinc-500" />
            </div>
        </div>
        <div className="w-52 h-4 justify-center text-red-default text-sm font-normal font-['Gantari']">Mot de passe oublié ?</div>
    </div>
    <div className="self-stretch p-2.5 flex flex-col justify-start items-start gap-2.5">
        <div data-property-1="Connexion - Button" className="self-stretch p-2.5 bg-red-default rounded-[10px] inline-flex justify-between items-center overflow-hidden">
            <div className="flex-1 text-center justify-center text-white text-xl font-bold font-['Gantari']">Se connecter</div>
            <div className="w-5 h-5 relative">
                <div className="w-5 h-3.5 left-[0.67px] top-[2.67px] absolute bg-white" />
            </div>
        </div>
    </div>
    <div className="p-2.5 flex flex-col justify-start items-center gap-2.5 overflow-hidden">
        <div className="self-stretch text-center justify-center text-black text-3xl font-normal font-['Gantari']">ou</div>
        <div data-property-1="Connexion" className="w-72 p-2.5 bg-white rounded-[10px] inline-flex justify-between items-center overflow-hidden">
            <div className="w-6 h-6 relative">
                <div className="w-6 h-6 left-0 top-0 absolute bg-sky-600" />
            </div>
            <div className="flex-1 self-stretch text-center justify-center text-black text-xs font-normal font-['Gantari']">Se connecter avec Google</div>
        </div>
    </div>
    <div className="self-stretch p-2.5 flex flex-col justify-center items-center gap-2.5 overflow-hidden">
        <div className="text-center justify-start text-black text-xs font-normal font-['Gantari']">Vous n’avez pas de Compte ?</div>
        <div className="text-center justify-start text-red-default text-xl font-normal font-['Gantari']">Inscrivez-vous</div>
    </div>
</div>
  );
}
