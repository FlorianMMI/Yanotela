interface CommentProps {
  variant?: "user" | "member";
  author: { pseudo: string } | string;
  date: string;
  text: string;
}

export default function Comment({ variant = "user", author, date, text }: CommentProps) {
  // Définir la classe selon le variant
  let divClass = "w-full flex";
  if (variant === "user") {
    divClass += " justify-start";
  } else if (variant === "member") {
    divClass += " justify-end";
  }

  // Formatage date
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <section className={divClass}>
      <div className="bg-background rounded-xl shadow-sm border w-80 p-2 md:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-primary text-sm">{typeof author === 'string' ? author : author?.pseudo}</span>
            <span className="text-xs text-gray-400">{dateStr}</span>
          </div>
          <p className="text-sm whitespace-pre-line">{text}</p>
        </div>
      </div>
    </section>
  );
}
  
