interface Props {
    name: string;
    pseudo :string;
    email :string;
}

export default function Infoprofil(Props: Props) {
    return (
        <>
            <section className="flex flex-col items-center gap-4 p-6 bg-[var(--background)] rounded-md">

                <article className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-title mb-2 ">{Props.name}</h2>
                    <p className="text-sm font-bold text-gray-600 mt-1">@{Props.pseudo}</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">{Props.email}</p>
                </article>
            </section>
        </>
    )
}