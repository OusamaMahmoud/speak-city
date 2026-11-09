import { api, type ReviewItem } from "@/lib/api";
import { ReviewClient } from "@/components/ui/ReviewClient";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const data = await api<{ items: ReviewItem[]; boxes: Record<string, number> }>("/review?limit=40");
  return <ReviewClient items={data.items} boxes={data.boxes} />;
}
