/** Tutorial game types. The content lives in `content.ts`. */

export type Difficulty = 'basic' | 'intermediate' | 'advanced';

/** How the instructive scene of a step is drawn. */
export type SceneType = 'menu' | 'form' | 'sheet' | 'list' | 'intro';

export interface FieldSpec {
  /** Translation key for the field label. */
  labelKey: string;
  kind: 'text' | 'select' | 'number' | 'check';
  value?: string;
  /** The animated cursor travels to this field and highlights it. */
  highlighted?: boolean;
}

export interface SceneSpec {
  type: SceneType;
  /** Menu path to walk, e.g. ['System', 'Maintenance', 'Install or repair (all)']. */
  menuPath?: string[];
  /** Id of the REAL form (form registry) to render instead of the mockup. */
  form?: string;
  /** Real DOM ids to highlight inside the form. */
  highlightIds?: string[];
  /** Sample values to paint in the real form, keyed by field id. */
  sampleValues?: Record<string, string>;
  /** Title of the modal form (type 'form') or of the list (type 'list'). */
  title?: string;
  fields?: FieldSpec[];
  /** Visible tabs of the spreadsheet (type 'sheet'); the first one is highlighted. */
  tabs?: string[];
  /** Translation key for the toast the sheet shows (type 'sheet'), e.g. 'Done: 14 sheets'. */
  toastKey?: string;
  /** Which footer button to highlight in a form: 'save' | 'cancel'. */
  button?: 'save' | 'cancel';
}

/** A step: a single action the user performs in the real software. */
export interface Step {
  /** Stable; persisted in localStorage. Format `f01-1`. */
  id: string;
  titleKey: string;
  /** What to do NOW, a single action. Supports <span class="tag"> for system buttons. */
  instructionKey: string;
  /** Extra context (the manual's "det"). */
  detailKey?: string;
  /** Shown on completion: what just happened in the system. */
  whatHappensKey?: string;
  hintKey?: string;
  scene: SceneSpec;
}

/** A mission = a manual flow (f01..f13). */
export interface Mission {
  /** Matches the flow id in the manual (anchor `Manual_de_usuario.html#f01`). */
  id: string;
  titleKey: string;
  /** What this flow is for, in one phrase. */
  whyKey: string;
  steps: Step[];
}

export interface Level {
  id: Difficulty;
  titleKey: string;
  /** Short phrase that introduces the level on the map. */
  mottoKey: string;
  order: number;
  missions: Mission[];
}
