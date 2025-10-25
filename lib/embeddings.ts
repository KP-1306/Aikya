// lib/embeddings.ts
export async function embedText(text: string): Promise<number[]> {
  // TODO: call your provider (OpenAI, etc). Return array<number> length 1536.
  // Example shape:
  // const res = await fetch("https://api.openai.com/v1/embeddings", { ... })
  // return res.data[0].embedding;
  throw new Error("embedText not wired to provider yet");
}

export function buildStoryText(s: {
  title: string; dek?: string; what?: string; how?: string; why?: string; life_lesson?: string; virtues?: string[];
}) {
  return [
    s.title, s.dek, s.what, s.how, s.why, s.life_lesson,
    (s.virtues || []).join(", ")
  ].filter(Boolean).join("\n");
}
