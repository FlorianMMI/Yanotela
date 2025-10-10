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
      <section className="flex items-center gap-4 p-6 rounded-md w-full h-fit relative justify-center">

        <div className="flex flex-row gap-1 items-center justify-center text-center relative w-fit h-fit">

          {/* Info utilisateur */}
          <section className="flex flex-col gap-2 items-center text-center">
            <h2 className="text-3xl md:text-xl font-title text-clrprincipal text-center">
              {Props.name}
            </h2>

            <p className="text-lg font-bold text-clrprincipal ">
              @{Props.pseudo}
            </p>

            <p className="text-lg font-bold text-clrprincipal ">
              {Props.email}
            </p>
          </section>

            <button
              className="flex items-center justify-center absolute top-1/2 -right-12 transform -translate-y-1/2 w-fit h-fit "
              onClick={handleModifyProfile}
              aria-label="Modifier le profil"
              title="Modifier le profil"
            >
              <Icons
              name="modif"
              size={30}
              className="cursor-pointer rounded-full p-2 bg-primary text-white hover:shadow-lg transition-all hover:scale-110"
              />
            </button>

        </div>

      </section>
    </>
  );
}
