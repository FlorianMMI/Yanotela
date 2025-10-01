interface Props {
    name: string;
    pseudo: string;
    email: string;
    
}

export default function Infoprofil(Props: Props) {
    console.log(Props);
    return (
        <>
            <section className="flex flex-col items-center gap-4 p-6 bg-[var(--background)] rounded-md">
                <article className="flex flex-col gap-1 items-center text-center">
                    <h2 className="text-3xl md:text-8xl font-title text-clrprincipal ">{Props.name}</h2>
                    <p className="text-lg font-bold text-clrprincipal ">@{Props.pseudo}</p>
                    <p className="text-lg font-bold text-clrprincipal ">{Props.email}</p>
                    
                </article>
            </section>
        </>
    )
}