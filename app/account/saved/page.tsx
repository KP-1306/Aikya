// app/account/saved/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SaveButton from "@/components/SaveButton";
import { supabaseServer } from "@/lib/supabase/server";
import { getSavedStories } from "@/lib/saved";

export default async function SavedPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // require auth
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/signin");

  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const limit = 24;

  const { items, total } = await getSavedStories(page, limit);
  const hasNext = page * limit < total;
  const hasPrev = page > 1;

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved stories</h1>
          <p className="text-sm text-neutral-600">
            Your private bookmarks. Only you can see these.
          </p>
        </div>

        <nav className="text-sm">
          <Link href="/account" className="underline hover:no-underline">
            ← Back to Account
          </Link>
        </nav>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-white/60 p-6 text-sm text-neutral-600">
          You haven’t saved any stories yet. Browse the{" "}
          <Link href="/" className="underline">home feed</Link> and tap <strong>Save</strong>.
        </div>
      ) : (
        <>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s: any) => (
              <li key={s.id} className="card overflow-hidden">
                <Link href={`/story/${s.slug}`} className="block">
                  <div className="relative w-full aspect-[16/9] bg-neutral-100">
                    {s.hero_image && (
                      <Image
                        src={s.hero_image}
                        alt={s.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-neutral-500">
                      {(s.city || s.state || s.country) ?? "—"} • {s.read_minutes ?? 3} min
                    </div>
                    <h3 className="mt-1 font-semibold line-clamp-2">{s.title}</h3>
                    <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{s.dek}</p>
                  </div>
                </Link>

                {/* Unsave from list */}
                <div className="p-4 pt-0">
                  <SaveButton storyId={s.id} initialSaved={true} />
                </div>
              </li>
            ))}
          </ul>

          {/* Pager */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/account/saved${hasPrev ? `?page=${page - 1}` : ""}`}
              className={`btn border ${!hasPrev ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={!hasPrev}
            >
              ← Newer
            </Link>
            <div className="text-sm text-neutral-500">
              Page {page} • {total} saved
            </div>
            <Link
              href={`/account/saved${hasNext ? `?page=${page + 1}` : ""}`}
              className={`btn border ${!hasNext ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={!hasNext}
            >
              Older →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
