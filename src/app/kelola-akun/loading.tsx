function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}

export default function KelolaAkunLoading() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
      <section className="space-y-3">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-40" />
      </section>
      <section className="space-y-3">
        <SkeletonBlock className="h-5 w-24" />
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </section>
    </main>
  );
}
