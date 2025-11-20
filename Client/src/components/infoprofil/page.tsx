import React from "react";
import Icons from "@/ui/Icon";
import { useRouter } from "next/navigation";
import { ModifIcon } from "@/libs/Icons";

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
      {/* Card-like layout on mobile, revert to inline style on md+ */}
      <section className="bg-white rounded-xl shadow-lg p-6 w-full x-auto flex flex-row items-start gap-6 relative md:bg-transparent md:shadow-none md:p-6 md:w-fit">

        <article className="flex flex-col gap-3 text-left w-full">

          <h2
            className="text-2xl md:text-3xl font-title text-clrprincipal leading-tight mr-4"
            style={({ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as unknown) as React.CSSProperties}
            title={Props.name}
          >
            {Props.name}
          </h2>

          <p className="text-base md:text-sm font-bold text-clrprincipal truncate max-w-full">
            @{Props.pseudo}
          </p>
          <p className="text-base md:text-sm text-clrprincipal truncate max-w-full">
            {Props.email}
          </p>

        </article>

        <button
          className="shrink-0 ml-2 flex items-center justify-center"
          onClick={handleModifyProfile}
          aria-label="Modifier le profil"
        >
          <ModifIcon
            width={34}
            height={34}
            className="cursor-pointer rounded-full p-2 bg-primary text-white hover:shadow-md transition-all duration-300"
          />
        </button>

      </section>
    </>
  );
}
