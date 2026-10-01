/**
 * Décode des octets UTF-8 (BOM initial retiré) ; `null` si les octets ne sont pas de l'UTF-8 valide.
 * Les fins de ligne et le reste du contenu sont conservés tels quels.
 */
export function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
