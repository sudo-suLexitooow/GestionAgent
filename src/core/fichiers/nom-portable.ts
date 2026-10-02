// Règle R1 d'ADR-001 : nom de fichier ou de dossier portable entre Windows, macOS et Linux, vérifié
// segment par segment. (L'unicité après repli de casse et normalisation NFC relève de l'appelant.)

/** Caractères interdits dans un nom de fichier sous Windows ou macOS, et caractères de contrôle. */
// eslint-disable-next-line no-control-regex
export const CARACTERES_INTERDITS = /[<>:"/\\|?*\u0000-\u001f]/u;
/** Noms réservés Windows, quelle que soit la casse, avec ou sans extension (R1). */
export const NOMS_RESERVES = /^(CON|PRN|AUX|NUL|COM[0-9¹²³]|LPT[0-9¹²³])(\..*)?$/iu;
const OCTETS_MAX = 255;

/** Vrai si `segment` (un seul nom, sans `/`) respecte R1. */
export function segmentPortable(segment: string): boolean {
  return (
    segment !== "" &&
    segment !== "." &&
    segment !== ".." &&
    !CARACTERES_INTERDITS.test(segment) &&
    !NOMS_RESERVES.test(segment) &&
    !/[ .]$/u.test(segment) &&
    new TextEncoder().encode(segment).length <= OCTETS_MAX
  );
}
