import React from "react";
import Icons from "@/ui/Icon";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  pseudo: string;
  email: string;
}

export default function Infoprofil(Props: Props) {
  const router = useRouter();

  const handleModifyProfile = () => {
    router.push("/profil/modification");
  };

  return (
    <>
      <section className="flex items-center gap-4 p-6 rounded-md w-fit h-fit relative">
        <article className="flex flex-col gap-1 items-center text-center">
          <div className="grid grid-cols-3 items-center w-full">
            <div></div> {/* Espace vide pour équilibrer */}
            <h2 className="text-3xl md:text-xl font-title text-clrprincipal text-center">
              {Props.name}
            </h2>
            <div className="flex justify-center">
              <button
                className="flex items-center justify-center"
                onClick={handleModifyProfile}
                aria-label="Modifier le profil"
              >
                <Icons
                  name="modif"
                  size={30}
                  className="cursor-pointer rounded-full p-2 bg-primary text-white hover:shadow-md transition-all duration-300"
                />
              </button>
            </div>
          </div>

          <p className="text-lg font-bold text-clrprincipal ">
            @{Props.pseudo}
          </p>
          <p className="text-lg font-bold text-clrprincipal ">{Props.email}</p>
        </article>
      </section>
    </>
  );
}
