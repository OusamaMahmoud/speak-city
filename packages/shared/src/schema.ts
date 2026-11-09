import { z } from "zod";

/** One word from the vocabulary book, taught inside a scene. */
export const WordDef = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
  example: z.string().min(1),
});
export type WordDef = z.infer<typeof WordDef>;

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

/**
 * A prop placed in the world. `type` picks a component from the web app's prop registry.
 * `word` makes it tappable and teaches that word. `item` makes it a quest pickup.
 */
export const PropDef = z.object({
  type: z.string(),
  pos: Vec3,
  rotY: z.number().optional(),
  size: Vec3.optional(),
  color: z.string().optional(),
  label: z.string().optional(),
  sub: z.string().optional(),
  kind: z.string().optional(),
  word: z.string().optional(),
  item: z.string().optional(),
  /** grouping tag used by "visit" quest steps, e.g. "europe" */
  tag: z.string().optional(),
  solid: z.boolean().optional(),
});
export type PropDef = z.infer<typeof PropDef>;

export const OptionDef = z.object({
  en: z.string(),
  ok: z.boolean().optional(),
  why: z.string().optional(),
});
export type OptionDef = z.infer<typeof OptionDef>;

export const DialogueStep = z.object({
  npc: z.string(),
  ar: z.string(),
  options: z.array(OptionDef).min(2),
  after: z.string(),
  /** words learned when this step is answered correctly */
  teaches: z.array(z.string()).optional(),
  /** a named effect the scene can react to, e.g. "scan", "pay" */
  effect: z.string().optional(),
});
export type DialogueStep = z.infer<typeof DialogueStep>;

export const NpcDef = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  model: z.enum(["female", "male", "mannequin"]),
  pos: Vec3,
  rotY: z.number(),
  outfit: z
    .object({
      hat: z.enum(["chef", "cap", "scarf"]).optional(),
      apron: z.string().optional(),
      costume: z.enum(["hotdog"]).optional(),
      tint: z.string().optional(),
    })
    .optional(),
  voicePitch: z.number().default(1),
  word: z.string().optional(),
  /** conversations in order; each opens once its `requires` quest step is done */
  dialogues: z.array(z.object({ key: z.string(), requires: z.string().optional() })).default([]),
  /** said when there is nothing (left) to talk about */
  idleLine: z.tuple([z.string(), z.string()]),
  /** said while the next conversation is still locked */
  lockedLine: z.tuple([z.string(), z.string()]).optional(),
});
export type NpcDef = z.infer<typeof NpcDef>;

export const QuestStep = z.object({
  id: z.string(),
  ar: z.string(),
  /** done when the dialogue with this key finishes */
  dialogue: z.string().optional(),
  /** done when all these items are picked up */
  items: z.array(z.string()).optional(),
  /** done when at least one prop with each of these tags was tapped */
  visit: z.array(z.string()).optional(),
});
export type QuestStep = z.infer<typeof QuestStep>;

export const SceneDef = z.object({
  slug: z.string(),
  order: z.number().int(),
  title: z.string(),
  titleAr: z.string(),
  page: z.number().int(),
  intro: z.string(),
  environment: z.enum(["indoor", "street"]),
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  start: z.object({ x: z.number(), z: z.number(), yaw: z.number() }),
  counter: z.object({ label: z.string(), start: z.number(), unit: z.string() }).optional(),
  words: z.array(WordDef).min(1),
  items: z.array(z.object({ id: z.string(), en: z.string(), ar: z.string(), word: z.string() })).default([]),
  props: z.array(PropDef),
  npcs: z.array(NpcDef),
  dialogues: z.record(z.array(DialogueStep)),
  quest: z.array(QuestStep),
  outro: z.object({ title: z.string(), ar: z.string() }),
});
export type SceneDef = z.infer<typeof SceneDef>;

export const BOOK_TOTAL = 5000;
