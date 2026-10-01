// Enregistrement des skills importées (US-004) : copie à l'octet près dans `.cadre/skills/`,
// adoption dans `generated.yaml`, dans la même transaction que le reste du cadrage.
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { importContexts } from "../contexts/import-contexts";
import type { SkillImport } from "../skills/import-skills";
import { listProjectSkills } from "../skills/list-project-skills";
import { DisqueMemoire } from "../testing/disque-memoire";
import { enregistrerCadrage } from "./enregistrer-cadrage";

const RACINE = "/home/lea/projet";
const OPTIONS = { adapter: claudeCodeAdapter, generatorVersion: "1.2.3" };
const texte = (s: string) => new TextEncoder().encode(s);

// Champs inconnus de Cadre (Agent Skills et Claude Code), CRLF, sans fin de ligne finale.
const REVUE_MD = texte(
  "---\r\nname: revue\r\ndescription: Relit le code.\r\nallowed-tools: Read Grep\r\n" +
    "metadata:\r\n  equipe: front\r\nx-inconnu: [1, 2]\r\n---\r\n# Revue\r\nCorps  ",
);
const LOGO = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x0d, 0x0a);
const SKILLS = {
  ".claude/skills/revue/SKILL.md": REVUE_MD,
  ".claude/skills/revue/references/guide.md": "# Guide\n",
  ".claude/skills/revue/assets/img/logo.png": LOGO,
};

function sha256SansCrlf(octets: Uint8Array): string {
  const lf = Buffer.from(Buffer.from(octets).toString("latin1").replaceAll("\r\n", "\n"), "latin1");
  return createHash("sha256").update(lf).digest("hex");
}

async function importer(disque: DisqueMemoire): Promise<SkillImport> {
  const operation = claudeCodeAdapter.importer;
  if (!operation) throw new Error("l'adaptateur Claude Code doit savoir importer");
  return operation(disque, RACINE);
}

/** Projet Git sans modèle, ses skills importées en mémoire, et l'enregistrement du cadrage. */
async function projetImporte(contenu: Record<string, string | Uint8Array> = SKILLS) {
  const disque = new DisqueMemoire(RACINE, { ".git/HEAD": "ref: refs/heads/main\n", ...contenu });
  const { skills } = await importer(disque);
  const enregistrer = () =>
    enregistrerCadrage(
      { fichiers: disque, systeme: disque },
      RACINE,
      { contextes: [], agents: [], skills },
      OPTIONS,
    );
  return { disque, skills, enregistrer };
}

describe("enregistrer les skills importées (AC-004-1)", () => {
  test("test_ac_004_1_une_seule_transaction_copie_chaque_fichier_dans_cadre_skills", async () => {
    const { disque, enregistrer } = await projetImporte();

    expect(await enregistrer()).toEqual({ ok: true });

    expect(disque.transactions).toHaveLength(1);
    expect(disque.transactions[0]?.map((fichier) => fichier.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/skills/revue/SKILL.md",
      ".cadre/skills/revue/assets/img/logo.png",
      ".cadre/skills/revue/references/guide.md",
      ".cadre/generated.yaml",
      ".gitignore",
    ]);
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
    expect(disque.octets(".cadre/skills/revue/assets/img/logo.png")).toEqual(LOGO);
    expect(disque.octets(".cadre/skills/revue/references/guide.md")).toEqual(texte("# Guide\n"));
  });

  test("test_ac_004_1_rouvrir_liste_le_meme_nom_et_la_meme_description", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    expect(await listProjectSkills(disque, RACINE, claudeCodeAdapter)).toEqual([
      { folder: "revue", status: "ok", name: "revue", description: "Relit le code." },
    ]);
  });

  test("test_ac_004_1_generated_yaml_adopte_chaque_fichier_de_skill_avec_son_empreinte", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    const manifeste: unknown = parse(
      new TextDecoder().decode(disque.octets(".cadre/generated.yaml")),
    );
    expect(manifeste).toEqual({
      files: [
        {
          path: ".claude/skills/revue/SKILL.md",
          adapter: "claude-code",
          source: "skill:revue",
          sha256: sha256SansCrlf(REVUE_MD),
        },
        {
          path: ".claude/skills/revue/assets/img/logo.png",
          adapter: "claude-code",
          source: "skill:revue",
          sha256: sha256SansCrlf(LOGO),
        },
        {
          path: ".claude/skills/revue/references/guide.md",
          adapter: "claude-code",
          source: "skill:revue",
          sha256: sha256SansCrlf(texte("# Guide\n")),
        },
      ],
    });
  });

  test("test_ac_004_1_skills_et_contextes_dans_la_meme_transaction", async () => {
    const disque = new DisqueMemoire(RACINE, { "CLAUDE.md": "# Projet\n", ...SKILLS });
    const { contexts } = await importContexts(disque, RACINE, claudeCodeAdapter.contextFiles ?? []);
    const { skills } = await importer(disque);

    const resultat = await enregistrerCadrage(
      { fichiers: disque, systeme: disque },
      RACINE,
      { contextes: contexts, agents: [], skills },
      OPTIONS,
    );

    expect(resultat).toEqual({ ok: true });
    expect(disque.transactions).toHaveLength(1);
    const chemins = disque.transactions[0]?.map((fichier) => fichier.chemin) ?? [];
    expect(chemins).toContain(".cadre/contexte/CLAUDE.md");
    expect(chemins).toContain(".cadre/skills/revue/SKILL.md");
  });

  test("test_ac_004_1_les_fichiers_d_origine_ne_sont_pas_modifies", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    expect(disque.octets(".claude/skills/revue/SKILL.md")).toEqual(REVUE_MD);
    expect(disque.octets(".claude/skills/revue/assets/img/logo.png")).toEqual(LOGO);
    expect(
      disque.transactions.flat().filter((fichier) => fichier.chemin.startsWith(".claude/")),
    ).toEqual([]);
  });
});

describe("champs d'en-tête inconnus de Cadre (AC-004-2)", () => {
  test("test_ac_004_2_champs_inconnus_conserves_apres_import_et_enregistrement", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    const enregistre = new TextDecoder().decode(disque.octets(".cadre/skills/revue/SKILL.md"));
    const entete: unknown = parse(
      enregistre.split("\r\n---\r\n")[0]?.replace(/^---\r\n/, "") ?? "",
    );
    expect(entete).toEqual({
      name: "revue",
      description: "Relit le code.",
      "allowed-tools": "Read Grep",
      metadata: { equipe: "front" },
      "x-inconnu": [1, 2],
    });
  });
});

describe("skill à l'en-tête invalide (AC-004-3)", () => {
  test("test_ac_004_3_importee_telle_quelle_marquee_en_erreur_et_les_autres_continuent", async () => {
    const casse = texte("---\nname: casse\ndescription: b: c\n---\n# Corps\n");
    const { disque, skills, enregistrer } = await projetImporte({
      ...SKILLS,
      ".claude/skills/casse/SKILL.md": casse,
      ".claude/skills/casse/notes.md": "# Notes\n",
    });
    expect(skills.map(({ skill }) => [skill.folder, skill.status])).toEqual([
      ["casse", "error"],
      ["revue", "ok"],
    ]);

    expect(await enregistrer()).toEqual({ ok: true });

    expect(disque.octets(".cadre/skills/casse/SKILL.md")).toEqual(casse);
    expect(disque.octets(".cadre/skills/casse/notes.md")).toEqual(texte("# Notes\n"));
    const listees = await listProjectSkills(disque, RACINE, claudeCodeAdapter);
    expect(listees.map((skill) => [skill.folder, skill.status])).toEqual([
      ["casse", "error"],
      ["revue", "ok"],
    ]);
  });
});

describe("projet de 200 skills (AC-004-5)", () => {
  test("test_ac_004_5_200_skills_importees_et_enregistrees_sans_perte", async () => {
    const contenu: Record<string, string> = {};
    for (let i = 0; i < 200; i++) {
      const nom = `skill-${String(i).padStart(3, "0")}`;
      contenu[`.claude/skills/${nom}/SKILL.md`] =
        `---\nname: ${nom}\ndescription: N° ${String(i)}\n---\n`;
      contenu[`.claude/skills/${nom}/references/ref.md`] = `# Référence ${String(i)}\n`;
    }
    const { disque, skills, enregistrer } = await projetImporte(contenu);
    const avant = (await claudeCodeAdapter.detectSkills(disque, RACINE)).length;

    expect(await enregistrer()).toEqual({ ok: true });

    expect(avant).toBe(200);
    expect(skills).toHaveLength(avant);
    const apres = await listProjectSkills(disque, RACINE, claudeCodeAdapter);
    expect(apres).toHaveLength(avant);
    expect(apres.every((skill) => skill.status === "ok")).toBe(true);
    const copies = disque.chemins().filter((c) => c.startsWith(".cadre/skills/"));
    expect(copies).toHaveLength(400);
  });
});
