// Replica exacta de gestion_diaria.normalizar_texto()
// minusculas, sin tildes, + como ' + ', espacios colapsados.
export function normalizarTexto(input: string | null | undefined): string | null {
  if (input == null) return null;
  let v = input.toLowerCase().replace(/\u00a0/g, ' ');
  const map: Array<[RegExp, string]> = [
    [/[\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5]/g, 'a'],
    [/[\u00e8\u00e9\u00ea\u00eb]/g, 'e'],
    [/[\u00ec\u00ed\u00ee\u00ef]/g, 'i'],
    [/[\u00f2\u00f3\u00f4\u00f5\u00f6]/g, 'o'],
    [/[\u00f9\u00fa\u00fb\u00fc]/g, 'u'],
    [/\u00f1/g, 'n'],
  ];
  for (const [re, rep] of map) v = v.replace(re, rep);
  v = v.replace(/\s*\+\s*/g, ' + ');
  v = v.replace(/\s+/g, ' ').trim();
  return v || null;
}
