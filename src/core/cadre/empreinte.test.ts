import { empreinte } from "./empreinte";

const octets = (texte: string) => new TextEncoder().encode(texte);

describe("empreinte d'un fichier adopté ou généré (ADR-001, D5)", () => {
  test("test_ac_077_1_empreinte_sha256_en_hexadecimal_minuscule", async () => {
    // Vecteurs de test officiels (FIPS 180-2).
    expect(await empreinte(octets(""))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(await empreinte(octets("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("test_ac_077_1_empreinte_calculee_apres_conversion_crlf_en_lf", async () => {
    expect(await empreinte(octets("# Projet\r\nRègles\r\n"))).toBe(
      await empreinte(octets("# Projet\nRègles\n")),
    );
  });

  test("test_ac_077_1_un_retour_chariot_isole_ou_un_octet_non_utf8_n_est_pas_converti", async () => {
    expect(await empreinte(octets("a\rb"))).not.toBe(await empreinte(octets("ab")));
    expect(await empreinte(octets("a\rb"))).not.toBe(await empreinte(octets("a\nb")));
    // Latin-1 + CRLF : la conversion porte sur les octets, sans décodage.
    expect(await empreinte(Uint8Array.of(0xe8, 0x0d, 0x0a))).toBe(
      await empreinte(Uint8Array.of(0xe8, 0x0a)),
    );
  });
});
