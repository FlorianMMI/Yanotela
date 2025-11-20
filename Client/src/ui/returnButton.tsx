import React from "react";
import { ArrowIcon } from '@/libs/Icons';
import { useRouter } from "next/navigation";

export default function ReturnButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="self-start p-0 h-8 cursor-pointer items-center"
    >
      <ArrowIcon width={32} height={32} className="hover:scale-75 transition-transform duration-200" />
    </button>
  );
}
