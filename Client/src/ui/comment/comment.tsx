export default function Comment({ variant = "user" }: { variant?: "user" | "member" }) {
  // Définir la classe selon le variant
  let divClass = "w-full flex";
  if (variant === "user") {
    divClass += " justify-start";
  } else if (variant === "member") {
    divClass += " justify-end";
  }

  return (
    <>
    <section className={divClass}>
      <div className="bg-background rounded-xl shadow-sm border w-80 p-2 md:p-4">
        {/* Content - Titre et contenu de la note */}
        <div className="flex flex-col gap-2">
          <p className="text-sm">Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat doloribus corrupti asperiores nesciunt, amet quod, quae dignissimos iusto qui dolorum ad consectetur totam soluta. Sed optio veniam culpa cum et?</p>
          {/* Date de modification */}
          <div className="m-0 border-t border-gray-100 flex justify-between items-center">
            {/* <p className="font-gantari text-xs text-element italic">
              Crée le {new Date(comment.ModifiedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p> */}
            <p className="font-gantari text-xs text-element italic">date: 9 janvier</p>
             <p className="font-gantari text-xs text-primary">Issan</p>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
