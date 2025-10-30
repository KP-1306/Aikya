export async function searchStories(q: string, k = 10) {
  const res = await fetch("/api/search", { method: "POST", body: JSON.stringify({ q, k }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Search failed");
  return j.data as Array<{ id: string; slug: string; title: string; dek: string; hero_image?: string; city?: string; state?: string; similarity?: number }>;
}
