import { parseSkillHeader } from "./skill-header";

describe("en-tête valide d'un SKILL.md", () => {
  test("test_ac_002_1_lit_le_nom_et_la_description", () => {
    const text = "---\nname: revue-code\ndescription: Relit une PR.\n---\n# Corps\n";

    expect(parseSkillHeader(text)).toEqual({
      kind: "valid",
      name: "revue-code",
      description: "Relit une PR.",
    });
  });

  test("test_ac_002_1_accepte_les_fins_de_ligne_crlf", () => {
    const text = "---\r\nname: a\r\ndescription: Fait A.\r\n---\r\nCorps\r\n";

    expect(parseSkillHeader(text)).toEqual({ kind: "valid", name: "a", description: "Fait A." });
  });

  test("test_ac_002_1_conserve_les_champs_connus_et_ignore_les_autres", () => {
    const text = "---\nname: a\nlicense: MIT\ndescription: >\n  Sur deux\n  lignes.\n---\n";

    expect(parseSkillHeader(text)).toEqual({
      kind: "valid",
      name: "a",
      description: "Sur deux lignes.\n",
    });
  });
});

describe("en-tête invalide d'un SKILL.md : la raison est donnée", () => {
  test.each([
    ["fichier sans en-tête", "# Titre\nTexte\n", { code: "no-header" }],
    ["fichier vide", "", { code: "no-header" }],
    ["en-tête jamais fermé", "---\nname: a\ndescription: d\n", { code: "unclosed-header" }],
    ["YAML invalide", "---\nname: a\ndescription: b: c\n---\n", { code: "yaml-syntax", line: 3 }],
    [
      "clé en double",
      "---\nname: a\nname: b\ndescription: d\n---\n",
      { code: "duplicate-key", line: 3 },
    ],
    ["en-tête qui est une liste", "---\n- a\n- b\n---\n", { code: "not-a-mapping" }],
    ["en-tête vide", "---\n---\nCorps\n", { code: "not-a-mapping" }],
    ["nom absent", "---\ndescription: d\n---\n", { code: "missing-name" }],
    [
      "nom qui n'est pas un texte",
      "---\nname: 42\ndescription: d\n---\n",
      { code: "missing-name" },
    ],
    ["description absente", "---\nname: a\n---\n", { code: "missing-description" }],
    ["description vide", "---\nname: a\ndescription: ''\n---\n", { code: "missing-description" }],
  ])("test_ac_002_3_%s", (_label, text, issue) => {
    expect(parseSkillHeader(text)).toEqual({ kind: "invalid", issue });
  });
});
