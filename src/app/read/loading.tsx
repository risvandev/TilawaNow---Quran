export default function ReadLoading() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
      <div className="mb-8 flex flex-row items-start md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
      </div>

      <div className="relative mb-8 h-12 w-full bg-muted/20 animate-pulse rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="h-48 bg-muted/10 animate-pulse rounded-2xl border border-border/50" />
        ))}
      </div>
    </div>
  );
}
