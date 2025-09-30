import React from "react";
import Icon from "@/ui/Icon";
import { useRouter } from "next/navigation";

export default function ReturnButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="self-start p-0 h-8 cursor-pointer"
    >
      <Icon
        name="arrow-ss-barre"
        className="hover:scale-75 transition-transform duration-200"
        size={32}
      />
    </button>
  );
}
