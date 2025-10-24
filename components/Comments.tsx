import { fetchCommentsForStory, isModerator } from "@/lib/comments";
import CommentForm from "./CommentForm";
import ModerateButtons from "./ModerateButtons";

export default async function Comments({ storyId }: { storyId: string }) {
  const comments = await fetchCommentsForStory(storyId);
  const canModerate = await isModerator();

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold mb-3">Comments</h3>

      <CommentForm storyId={storyId} />

      <ul className="mt-6 space-y-4">
        {comments.length === 0 && (
          <li className="text-sm text-neutral-500">Be the first to comment.</li>
        )}
        {comments.map(c => (
          <li key={c.id} className="rounded-xl border p-4 bg-white/60">
            <div className="text-sm text-neutral-600">
              <span className="font-medium">{c.author?.full_name ?? "Reader"}</span>{" · "}
              <time dateTime={c.created_at}>{new Date(c.created_at).toLocaleString()}</time>
              {!c.is_approved && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            {canModerate && (
              <ModerateButtons id={c.id} isApproved={c.is_approved} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
