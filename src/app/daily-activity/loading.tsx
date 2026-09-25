export default function DailyActivityLoading() {
  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-line/60 rounded-md animate-pulse" />
        <div className="h-4 w-96 bg-line/40 rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-paper-raised p-4 space-y-2">
            <div className="h-4 w-20 bg-line/60 rounded animate-pulse" />
            <div className="h-6 w-16 bg-line/80 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-paper-raised p-6 space-y-4">
        <div className="h-5 w-40 bg-line/60 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-paper rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
