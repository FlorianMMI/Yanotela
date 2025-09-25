import Icon from "@/ui/Icon";
import Link from "next/link";


export default function ConnexionBlock() {
  

  return (
    <div className="h-fit w-full md:w-fit p-2.5 flex flex-col justify-center items-center font-geo gap-8 text-clrprincipal">
      <div className="flex flex-col justify-center items-center gap-4 w-full">
        <p
          className="
        text-center text-primary text-l font-bold md:min-w-[500px] 
      "
        >
          Bon retour parmis nous
        </p>

        <Link
          href={"/login"}
          
          className="p-2.5 w-full  bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:bg-gray-400 rounded-[10px] flex justify-between items-center shadow-md cursor-pointer transition-colors"
        >
          <p className="flex-1 text-center justify-center text-white text-l font-bold font-gant pointer-events-none">
            Se connecter
          </p>
          <Icon
            name="arrow-barre"
            className="text-white pointer-events-none"
            size={30}
          />
        </Link>
      </div>

      <div className="flex flex-col justify-center items-center gap-2 ">
        <p className="text-center justify-center text-clrprincipal text-xs font-gant font-light">
          Vous n'avez pas de compte ?
        </p>
        <Link href={"/register"}
          
          className="text-center justify-center text-primary hover:text-primary-hover active:text-primary-hover text-lg font-normal font-gant cursor-pointer"
        >
          inscrivez-vous
        </Link>
      </div>
    </div>
  );
}
