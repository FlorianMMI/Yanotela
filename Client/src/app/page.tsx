"use client";

import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";
import ConnexionBlock from "@/ui/connexionblock";

export default function Home() {


  return (
    <div className="h-screen p-2.5 flex flex-col justify-center items-center">
      <ConnexionBlock />
    </div>
  );
}


