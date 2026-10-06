import { splitByMatches } from "@/lib/search";

// Muestra un texto resaltando (fondo celeste suave) las palabras que coincidieron con la búsqueda
// (incluye las parecidas: sin tilde o con un error de tipeo).
export function HighlightMatches({ text, matchedWords }: { text: string; matchedWords?: Set<string> }) {
  if (!matchedWords?.size) return <>{text}</>;
  return (
    <>
      {splitByMatches(text, matchedWords).map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="bg-brand-secondary/15 text-inherit rounded-sm"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
