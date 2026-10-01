// Empreinte des fichiers adoptés ou générés, inscrite dans `.cadre/generated.yaml` (ADR-001, D5).

const CR = 0x0d;
const LF = 0x0a;

/**
 * SHA-256 (hexadécimal minuscule) des octets après conversion CRLF → LF : une conversion des fins
 * de ligne par Git (`autocrlf`) n'est pas une modification de l'utilisateur. Aucun décodage : un
 * contenu non UTF-8 garde ses octets ; un CR isolé est conservé.
 */
export async function empreinte(octets: Uint8Array): Promise<string> {
  const condense = await crypto.subtle.digest("SHA-256", sansCrlf(octets));
  return Array.from(new Uint8Array(condense), (octet) => octet.toString(16).padStart(2, "0")).join(
    "",
  );
}

function sansCrlf(octets: Uint8Array): Uint8Array<ArrayBuffer> {
  const resultat = new Uint8Array(octets.length);
  let longueur = 0;
  for (let i = 0; i < octets.length; i++) {
    const octet = octets[i] as number;
    if (octet === CR && octets[i + 1] === LF) continue;
    resultat[longueur++] = octet;
  }
  return resultat.slice(0, longueur);
}
