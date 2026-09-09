function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}

export default function BerandaLoading() {
  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
      <section className="space-y-4">
        <SkeletonBlock className="h-5 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <SkeletonBlock className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </section>
    </main>
  );
}
