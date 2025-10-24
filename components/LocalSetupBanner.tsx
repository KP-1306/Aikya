// components/LocalSetupBanner.tsx
export default function LocalSetupBanner() {
  return (
    <div className="rounded-xl border bg-amber-50 text-amber-800 p-3 text-sm">
      Personalize your feed: set your <strong>City</strong> and <strong>State</strong> in{" "}
      <a href="/account" className="underline">Account</a>.
    </div>
  );
}
