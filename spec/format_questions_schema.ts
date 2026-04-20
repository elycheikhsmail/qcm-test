/**
 * Schéma TypeScript du format JSON intermédiaire pour validation des questions.
 * Ce format est produit par Claude Code et consommé par le script d'import PostgreSQL.
 */

export type QuestionType = "qcm" | "true_false" | "fill_blank";
export type ValidationStatus = "pending" | "approved" | "rejected";
export type Confidence = "high" | "medium" | "low";
export type Langue = "fr" | "ar";
export type GeneratedBy = "claude_code" | "claude_cowork";
export type Cycle = "Fondamental" | "Secondaire 1er cycle" | "Secondaire 2ème cycle";
export type NiveauCode = "1AF" | "2AF" | "3AF" | "4AF" | "5AF" | "6AF"
  | "1AS" | "2AS" | "3AS" | "4AS"
  | "5AS" | "6AS" | "7AS";

export interface QuestionBatchMeta {
  /** ISO 8601 — date/heure de génération */
  generated_at: string;
  generated_by: GeneratedBy;
  /** Nom du fichier PDF source (sans chemin) */
  source_file: string;
  niveau_code: NiveauCode;
  niveau_label: string;
  cycle: Cycle;
  /** null sauf pour 7AS où option vaut "C" ou "D" */
  option: "C" | "D" | null;
  chapitre_titre: string;
  chapitre_numero: number;
  langue_principale: Langue;
  total_questions: number;
}

export interface QuestionEnrichissement {
  /** Explication de la bonne réponse — affichée après correction côté app */
  explication: string;
  /** Indice optionnel affiché si l'élève bloque (feature post-MVP possible) */
  indice: string;
  /** Mots-clés / notions couvertes par la question */
  tags: string[];
  enrichi_par: GeneratedBy;
  /** ISO 8601 */
  enrichi_at: string;
}

export interface QuestionValidation {
  status: ValidationStatus;
  /** Auto-évaluation de Claude sur la fiabilité de la question générée */
  confidence: Confidence;
  /** Commentaire du relecteur humain (vide si non relu) */
  reviewer_notes: string;
}

export interface Question {
  /**
   * Identifiant temporaire — remplacé par l'id PostgreSQL à l'import.
   * Format : tmp_{niveau_code}_ch{nn}_{xxx}
   */
  id: string;
  type: QuestionType;
  langue: Langue;
  /** Texte de la question. Pour fill_blank, le blanc est marqué par ___ */
  content: string;
  /**
   * - QCM : tableau de 4 choix (l'ordre sera aléatoire côté app)
   * - true_false : null (les options "Vrai"/"Faux" sont gérées côté app)
   * - fill_blank : null
   */
  options: string[] | null;
  /**
   * - QCM : string correspondant à l'un des items de options
   * - true_false : "true" | "false"
   * - fill_blank : string du mot/nombre attendu (MVP : un seul blanc)
   */
  correct_answer: string;
  /** 1 = facile | 2 = moyen | 3 = difficile */
  difficulty: 1 | 2 | 3;
  /** Numéro de page dans le PDF source (pour relecture) */
  page_source: number;
  /**
   * Second passage IA — optionnel.
   * null si l'enrichissement n'a pas encore été fait.
   * Non requis pour import : le script insère même si null.
   */
  enrichissement: QuestionEnrichissement | null;
  validation: QuestionValidation;
}

export interface QuestionBatch {
  _comment?: string;
  _version: string;
  _doc?: string;
  meta: QuestionBatchMeta;
  questions: Question[];
}
