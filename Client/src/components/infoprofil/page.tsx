import React from 'react';

interface Props {
    name: string;
    pseudo: string;
    email: string;
    
}

export default function Infoprofil(Props: Props) {
    return (
        <>
            <section className="flex flex-col items-center gap-4 p-6 rounded-md w-fit h-fit mx-auto mt-10">

                <article className="flex flex-col gap-1 items-center text-center">
                    <h2 className="text-3xl md:text-xl font-title text-clrprincipal ">{Props.name}</h2>
                    <p className="text-lg font-bold text-clrprincipal ">@{Props.pseudo}</p>
                    <p className="text-lg font-bold text-clrprincipal ">{Props.email}</p>
                </article>

            </section>
        </>
    )
}