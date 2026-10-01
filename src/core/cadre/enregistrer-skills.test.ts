// Enregistrement des skills importées (US-004) : copie à l'octet près dans `.cadre/skills/`,
// adoption dans `generated.yaml`, dans la même transaction que le reste du cadrage.
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { creerAgent } from "../agents/agent";
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

describe("skills modifiées hors de Cadre entre l'import et l'enregistrement", () => {
  async function refuse(modifier: (disque: DisqueMemoire) => void, detail: string) {
    const { disque, enregistrer } = await projetImporte();
    modifier(disque);

    expect(await enregistrer()).toEqual({ ok: false, erreur: { code: "SOURCE_MODIFIEE", detail } });
    expect(disque.transactions).toEqual([]);
  }

  test("test_ac_004_1_annexe_modifie_depuis_l_import_refuse_sans_rien_ecrire", async () => {
    const guide = ".claude/skills/revue/references/guide.md";
    await refuse((disque) => {
      disque.modifierHorsCadre(guide, "# Guide modifié\n");
    }, guide);
  });

  test("test_ac_004_1_skill_md_supprime_depuis_l_import_refuse", async () => {
    const skillMd = ".claude/skills/revue/SKILL.md";
    await refuse((disque) => {
      disque.supprimerHorsCadre(skillMd);
    }, ".claude/skills/revue");
  });

  test("test_ac_004_1_fichier_ajoute_dans_une_skill_depuis_l_import_refuse", async () => {
    await refuse((disque) => {
      disque.modifierHorsCadre(".claude/skills/revue/nouveau.md", "# Nouveau\n");
    }, ".claude/skills/revue/nouveau.md");
  });

  test("test_ac_004_1_skill_apparue_depuis_l_import_refuse", async () => {
    await refuse((disque) => {
      disque.modifierHorsCadre(".claude/skills/neuve/SKILL.md", "---\nname: neuve\n---\n");
    }, ".claude/skills/neuve");
  });

  test("test_ac_004_1_une_conversion_crlf_en_lf_n_est_pas_une_modification", async () => {
    const { disque, enregistrer } = await projetImporte();
    disque.modifierHorsCadre(
      ".claude/skills/revue/SKILL.md",
      new TextDecoder().decode(REVUE_MD).replaceAll("\r\n", "\n"),
    );

    expect(await enregistrer()).toEqual({ ok: true });
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
  });
});

describe("créer le modèle sans avoir cliqué sur l'import (régression US-007)", () => {
  function frontend() {
    const creation = creerAgent(
      { nom: "frontend", role: "Front", description: "Écrans.", cible: "claude-code" },
      { nomsExistants: [], cibles: ["claude-code"] },
    );
    if (!creation.ok) throw new Error(creation.refus);
    return creation.agent;
  }

  function enregistrerAgentSeul(disque: DisqueMemoire) {
    return enregistrerCadrage(
      { fichiers: disque, systeme: disque },
      RACINE,
      { contextes: [], agents: [frontend()] },
      OPTIONS,
    );
  }

  test("test_ac_004_1_creer_le_modele_par_un_agent_importe_aussi_les_skills", async () => {
    const disque = new DisqueMemoire(RACINE, SKILLS);
    const avant = await listProjectSkills(disque, RACINE, claudeCodeAdapter);

    expect(await enregistrerAgentSeul(disque)).toEqual({ ok: true });

    expect(disque.transactions).toHaveLength(1);
    const chemins = disque.transactions[0]?.map((fichier) => fichier.chemin) ?? [];
    expect(chemins).toContain(".cadre/agents/frontend.yaml");
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
    expect(disque.octets(".cadre/skills/revue/assets/img/logo.png")).toEqual(LOGO);
    expect(disque.octets(".cadre/skills/revue/references/guide.md")).toEqual(texte("# Guide\n"));
    expect(await listProjectSkills(disque, RACINE, claudeCodeAdapter)).toEqual(avant);
    const manifeste: unknown = parse(
      new TextDecoder().decode(disque.octets(".cadre/generated.yaml")),
    );
    expect(manifeste).toMatchObject({
      files: [
        { path: ".claude/skills/revue/SKILL.md", source: "skill:revue" },
        { path: ".claude/skills/revue/assets/img/logo.png", source: "skill:revue" },
        { path: ".claude/skills/revue/references/guide.md", source: "skill:revue" },
      ],
    });
  });

  test("test_ac_004_3_creer_le_modele_par_un_agent_signale_les_skills_non_importees", async () => {
    const disque = new DisqueMemoire(RACINE, {
      ...SKILLS,
      ".claude/skills/liee/SKILL.md": "---\nname: liee\ndescription: L.\n---\n",
    }).addLink(".claude/skills/liee/externe.md");

    expect(await enregistrerAgentSeul(disque)).toEqual({
      ok: true,
      skillsNonImportees: [
        { folder: "liee", path: ".claude/skills/liee/externe.md", code: "link" },
      ],
    });
    expect(disque.octets(".cadre/skills/liee/SKILL.md")).toBeUndefined();
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
  });

  test("test_ac_004_1_avec_un_modele_un_agent_n_importe_aucune_skill", async () => {
    const disque = new DisqueMemoire(RACINE, {
      ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n",
      ...SKILLS,
    });

    expect(await enregistrerAgentSeul(disque)).toEqual({ ok: true });

    expect(disque.chemins().filter((c) => c.startsWith(".cadre/skills/"))).toEqual([]);
  });
});
