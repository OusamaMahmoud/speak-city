/** Leitner boxes shared by the API (scheduling) and the web app (labels). */
export const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;
export type Grade = "again" | "hard" | "good";

export function nextReview(box: number, grade: Grade, now = new Date()): { box: number; dueAt: Date } {
  let next = box;
  if (grade === "again") next = 1;
  else if (grade === "good") next = Math.min(MAX_BOX, box + 1);
  const days = grade === "again" ? 0 : grade === "hard" ? 1 : BOX_INTERVAL_DAYS[next];
  const dueAt = new Date(now.getTime() + days * 86_400_000);
  return { box: next, dueAt };
}
