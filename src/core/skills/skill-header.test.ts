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
