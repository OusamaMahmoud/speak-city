import * as fs from "fs";
import * as path from "path";
import { SceneDef } from "./schema";

/** Directory holding one JSON file per scene (one book page = one scene). */
export const SCENES_DIR = path.join(__dirname, "..", "content", "scenes");

/** Reads and validates every scene file. Throws with a readable message if a file is invalid. */
export function loadScenes(dir = SCENES_DIR): SceneDef[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const parsed = SceneDef.safeParse(raw);
      if (!parsed.success) throw new Error(`${f}: ${parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`);
      const scene = parsed.data;
      const words = new Set(scene.words.map((w) => w.en));
      const refs = [
        ...scene.props.map((p) => p.word),
        ...scene.npcs.map((n) => n.word),
        ...scene.items.map((i) => i.word),
        ...Object.values(scene.dialogues).flatMap((d) => d.flatMap((s) => s.teaches ?? [])),
      ].filter(Boolean) as string[];
      const unknown = refs.filter((r) => !words.has(r));
      if (unknown.length) throw new Error(`${f}: references words that are not in its word list: ${[...new Set(unknown)].join(", ")}`);
      return scene;
    })
    .sort((a, b) => a.order - b.order);
}
