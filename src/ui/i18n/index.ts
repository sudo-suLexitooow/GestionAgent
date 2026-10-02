// Libellés de l'interface (Q-22) : clés stables, français d'abord ; l'anglais viendra plus tard.

const RASSURANCE = "Vos fichiers n'ont pas été modifiés.";

const fr = {
  "app.title": "Cadre",
  "home.open": "Ouvrir un dossier",
  "home.dropHint": "ou déposez un dossier de projet dans cette fenêtre",
  "project.path": "Chemin",
  "error.not-found": "Ce dossier n'existe pas (ou plus). Vérifiez le chemin puis réessayez.",
  "error.unreadable": "Ce dossier ne peut pas être lu : droits d'accès insuffisants.",
  "error.not-a-directory": "Ce chemin n'est pas un dossier.",
  "error.drop-single-folder": "Déposez un seul dossier : pas un fichier, ni plusieurs éléments.",
  "error.project-preparation-failed":
    "Le projet n'a pas pu être préparé : son dossier .cadre/ est inaccessible ou une écriture interrompue n'a pas pu être reprise. Réessayez ; si le problème persiste, examinez le dossier .cadre/tmp du projet.",
  "openWarning.busy":
    "Une autre fenêtre de Cadre enregistre ce projet : la reprise des écritures interrompues est reportée.",
  "openWarning.setAside":
    "Une écriture interrompue n'a pas pu être reprise : des fichiers du projet peuvent être partiellement modifiés. Les copies d'origine sont dans le dossier indiqué, rien n'a été supprimé.",
  "openWarning.generic":
    "Une écriture interrompue n'a pas pu être reprise à l'ouverture du projet.",
  "openWarning.invalidPath":
    "Un chemin du dossier .cadre/ est un lien symbolique, une jonction ou n'est pas un vrai dossier : Cadre ne le suit pas, n'y écrit rien et n'y reprend aucune écriture interrompue.",
  "openWarning.detail": "Détail",
  "error.unexpected": "Le dossier n'a pas pu être ouvert. Réessayez.",
  "contexts.title": "Contextes",
  "contexts.detected":
    "Fichiers de contexte détectés. Les importer dans Cadre ? Les fichiers d'origine ne seront pas modifiés.",
  "contexts.import": "Importer",
  "contexts.decline": "Ne pas importer",
  "contexts.type.projet": "Projet",
  "contexts.type.conventions": "Conventions",
  "contexts.type.architecture": "Architecture",
  "contexts.type.autre": "Autre",
  "contexts.readonly": "lecture seule",
  "contexts.warning.encoding":
    "encodage non supporté (le fichier n'est pas en UTF-8) ; son contenu est importé tel quel.",
  "contexts.warning.unreadable": "le fichier ne peut pas être lu ; il n'est pas importé.",
  "contexts.warning.too-large":
    "le fichier dépasse la taille maximale de 8 Mio ; il n'est pas importé.",
  "contexts.warning.link": "lien non pris en charge ; il n'est pas importé.",
  "contexts.unsaved":
    "Non enregistré : ce qui a été importé n'est pas encore écrit dans le dossier .cadre/.",
  "import.skills.detected": "Skills à importer",
  "import.skills.copiedAnyway":
    "Les skills seront copiées dans Cadre à la création du modèle, même sans import.",
  "import.skills.imported": "Skills importées",
  "import.skills.failure.link": "lien non pris en charge",
  "import.skills.failure.too-large": "le fichier dépasse la taille maximale de 8 Mio",
  "import.skills.failure.unreadable": "ne peut pas être lu",
  "import.skills.failure.non-portable":
    "nom non portable (caractère interdit, point ou espace final, nom réservé Windows ou plus de 255 octets)",
  "import.skills.noneImported": "aucune skill n'est importée.",
  "import.skills.notImported": "la skill {nom} n'est pas importée.",
  "model.title": "Modèle",
  "model.readOnly":
    "Ce projet a été enregistré par une version plus récente de Cadre. Il est ouvert en lecture seule : mettez Cadre à jour pour le modifier.",
  "model.agentInError": "Agent en erreur",
  "model.contextInError": "Contexte en erreur",
  "model.failed": "Le modèle .cadre/ n'a pas pu être lu.",
  "model.failedLink":
    "Le modèle .cadre/ n'a pas pu être lu : un de ses chemins est un lien symbolique ou une jonction, que Cadre ne suit pas.",
  /** `{chemin}` : dossier lié, p. ex. `.cadre` (US-079). */
  "model.linkedFolder":
    "Le dossier {chemin} est un lien symbolique ou une jonction, non pris en charge : Cadre ne le suit pas et n'y écrit rien.",
  "model.incomplete": "Modèle incomplet",
  "model.repair":
    "Réparation proposée : recréer .cadre/cadre.yaml à partir du contenu de .cadre/. Rien n'a été écrit et rien ne le sera sans votre accord.",
  "model.error.CADRE_MISSING": "fichier absent",
  "model.error.ENCODING": "le fichier n'est pas encodé en UTF-8",
  "model.error.YAML_SYNTAX": "YAML invalide",
  "model.error.YAML_DUPLICATE_KEY": "clé en double",
  "model.error.YAML_ALIASES": "trop d'alias YAML (&, *) : fichier refusé par sécurité",
  "model.error.SCHEMA": "non conforme au format .cadre/ v1",
  "model.error.UNREADABLE": "le fichier ne peut pas être lu",
  "model.error.TOO_LARGE": "le fichier dépasse la taille maximale de 8 Mio",
  "model.error.LINK": "le fichier est un lien symbolique ou une jonction, que Cadre ne suit pas",
  "save.title": "Enregistrement",
  "save.button": "Enregistrer",
  "save.saving": "Enregistrement en cours…",
  "save.readOnly":
    "Enregistrement désactivé : ce projet a été enregistré par une version plus récente de Cadre. Mettez Cadre à jour pour le modifier.",
  "save.detail": "Détail",
  "save.error.SOURCE_MODIFIEE":
    "a changé depuis l'import (modifié, supprimé ou devenu illisible) : réimportez-le. Rien n'a été enregistré.",
  "save.error.MODELE_EXISTANT": `Enregistrement annulé : un modèle .cadre/ a été créé dans ce projet depuis l'import (par exemple par une autre fenêtre de Cadre). Il est affiché à la place ; vos contextes importés n'ont pas été enregistrés. ${RASSURANCE}`,
  "save.error.MODELE_NON_MODIFIABLE": `Enregistrement annulé : le modèle .cadre/ de ce projet est incomplet ou a été enregistré par une version plus récente de Cadre ; Cadre ne le modifie pas. ${RASSURANCE}`,
  /** `{nom}` : nom de l'agent non enregistré en conflit. */
  "save.error.AGENT_EXISTANT":
    'Un agent "{nom}" existe déjà sur le disque : retirez l\'agent non enregistré ou recréez-le sous un autre nom.',
  "save.error.LECTURE_SEULE": `Enregistrement impossible : le dossier du projet est en lecture seule ou son accès est refusé. ${RASSURANCE}`,
  "save.error.DISQUE_PLEIN": `Enregistrement impossible : le disque est plein. Libérez de l'espace puis réessayez. ${RASSURANCE}`,
  "save.error.CHEMIN_INVALIDE": `Enregistrement impossible : un chemin de fichier est invalide ou passe par un lien symbolique (par exemple un .gitignore lié à un autre fichier). ${RASSURANCE}`,
  "save.error.PROJET_OCCUPE":
    "Le projet est en cours d'enregistrement par une autre fenêtre de Cadre. Réessayez.",
  "save.error.ANNULATION_INCOMPLETE":
    "L'enregistrement a échoué et n'a pas pu être entièrement annulé ; Cadre terminera l'annulation à la prochaine opération.",
  "save.error.RECUPERATION_IMPOSSIBLE":
    "Enregistrement impossible : une écriture interrompue n'a pas pu être reprise. Des fichiers du projet peuvent être partiellement modifiés ; les copies d'origine sont dans le dossier indiqué dans le détail, rien n'a été supprimé. Réessayez pour enregistrer.",
  "save.error.ECHEC": `Enregistrement impossible à cause d'une erreur inattendue. ${RASSURANCE}`,
  "agents.title": "Agents",
  "agents.new": "Nouvel agent",
  "agents.name": "Nom",
  "agents.role": "Rôle",
  "agents.description": "Description",
  "agents.target": "Outil cible",
  "agents.create": "Créer l'agent",
  "agents.unsaved": "Non enregistré",
  "agents.unsavedGroup": "Agents non enregistrés",
  "agents.remove": "Retirer",
  "agents.warning.DESCRIPTION_MANQUANTE":
    "Agent créé, mais description manquante : renseignez son rôle et sa description, sans quoi l'outil cible pourrait ne pas le charger.",
  "agents.refus.NOM_VIDE": "Création refusée : le nom est obligatoire.",
  "agents.refus.NOM_CARACTERES_INTERDITS":
    'Création refusée : le nom contient un caractère interdit dans un nom de fichier sous Windows ou macOS (< > : " / \\ | ? * ou caractère de contrôle).',
  "agents.refus.NOM_RESERVE":
    "Création refusée : ce nom est réservé par Windows (CON, PRN, AUX, NUL, COM0 à COM9, LPT0 à LPT9), quelle que soit la casse.",
  "agents.refus.NOM_FORMAT":
    "Création refusée : le nom doit compter 1 à 64 caractères parmi les lettres sans accent, les chiffres, - et _, sans commencer ni finir par - ou _.",
  "agents.refus.NOM_EXISTANT":
    "Création refusée : un agent porte déjà ce nom (majuscules et minuscules ne sont pas distinguées).",
  "agents.refus.CIBLE_INDISPONIBLE":
    "Création refusée : aucun adaptateur n'est disponible pour cet outil.",
  "skills.title": "Skills",
  "skills.none": "Aucune skill détectée.",
  "skills.failed": "Les skills n'ont pas pu être lues.",
  /** Précédé du dossier lié : « .claude : … » (US-079). */
  "skills.linkedFolder":
    "lien symbolique ou jonction non pris en charge ; Cadre ne le suit pas et n'y lit aucune skill.",
  "skills.inError": "en erreur",
  "skills.line": "ligne",
  "skills.issue.no-header":
    "pas d'en-tête YAML (le fichier SKILL.md doit commencer par une ligne ---)",
  "skills.issue.unclosed-header": "en-tête YAML non fermé (ligne --- de fin manquante)",
  "skills.issue.yaml-syntax": "YAML invalide",
  "skills.issue.duplicate-key": "clé en double dans l'en-tête YAML",
  "skills.issue.not-a-mapping": "l'en-tête YAML doit être une suite de champs « clé: valeur »",
  "skills.issue.missing-name": "le champ name est absent ou vide",
  "skills.issue.missing-description": "le champ description est absent ou vide",
  "skills.issue.encoding": "le fichier SKILL.md n'est pas encodé en UTF-8",
  "skills.issue.unreadable": "le fichier SKILL.md ne peut pas être lu",
  "skills.issue.too-large": "le fichier SKILL.md dépasse la taille maximale de 8 Mio",
  "skills.issue.link": "lien non pris en charge",
} as const;

export type LabelKey = keyof typeof fr;

export function t(key: LabelKey): string {
  return fr[key];
}
