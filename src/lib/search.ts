// Búsqueda tolerante para listados en el cliente: ignora tildes y mayúsculas,
// compara palabra por palabra (en cualquier orden y aunque haya palabras en medio)
// y acepta errores de tipeo ("subterraanea" ~ "subterránea", "caza" ~ "casa").

/** Quita tildes y diacríticos y pasa a minúsculas */
export function normalizeText(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function tokenize(str: string) {
  return normalizeText(str).split(/[^a-z0-9ñ]+/).filter(Boolean);
}

/** Distancia de edición (letras insertadas, borradas o cambiadas), cortando al pasar `max` */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

/** Errores de tipeo permitidos según el largo de la palabra buscada */
function allowedTypos(word: string) {
  if (word.length <= 3) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

/**
 * Qué tan bien coincide una palabra buscada con una palabra del texto:
 * 3 = igual · 2 = el texto empieza con ella (o la contiene) · 1 = parecida (error de tipeo) · 0 = no coincide
 */
function wordScore(query: string, word: string) {
  if (word === query) return 3;
  if (word.startsWith(query) || (query.length >= 3 && word.includes(query))) return 2;
  const typos = allowedTypos(query);
  if (typos === 0) return 0;
  if (editDistance(query, word, typos) <= typos) return 1;
  // También contra el inicio de la palabra (palabras a medio escribir), solo desde 5
  // letras: con menos es muy permisivo ("sire" ~ "STREamlit")
  if (query.length >= 5 && word.length > query.length &&
      editDistance(query, word.slice(0, query.length), typos) <= typos) return 1;
  return 0;
}

export interface SearchMatch {
  /** Puntaje para ordenar: más alto = más parecido. 0 = no aparece en los resultados */
  score: number;
  /** Palabras del texto (normalizadas) que coincidieron, para resaltarlas */
  matchedWords: Set<string>;
}

/**
 * Compara una búsqueda con un texto. Aparece si coincide al menos la mitad de las
 * palabras buscadas (todas si se escribió una o dos), así una palabra mal escrita
 * o de más no deja la lista vacía.
 */
export function fuzzyMatch(query: string, text: string): SearchMatch {
  const queryWords = tokenize(query);
  if (!queryWords.length) return { score: 1, matchedWords: new Set() };

  const textWords = tokenize(text);
  const matchedWords = new Set<string>();
  let total = 0;
  let found = 0;

  for (const q of queryWords) {
    let best = 0;
    for (const w of textWords) {
      const s = wordScore(q, w);
      if (s > 0) matchedWords.add(w);
      best = Math.max(best, s);
    }
    if (best > 0) found++;
    total += best;
  }

  const required = queryWords.length <= 2 ? queryWords.length : Math.ceil(queryWords.length / 2);
  if (found < required) return { score: 0, matchedWords: new Set() };

  // Primero los que coinciden con más palabras; a igualdad, los de coincidencia más exacta
  return { score: found * 10 + total, matchedWords };
}

/**
 * Parte un texto en trozos marcando las palabras que coincidieron, para resaltarlas
 * sin alterar el texto original (tildes y mayúsculas se conservan).
 */
export function splitByMatches(text: string, matchedWords: Set<string>) {
  if (!matchedWords.size) return [{ text, match: false }];
  return text
    .split(/([^\p{L}\p{N}]+)/u)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: matchedWords.has(normalizeText(part)) }));
}
