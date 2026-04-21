export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-6 w-64 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Khatmah Widget Skeleton */}
        <div className="glass-card p-6 mb-8 bg-muted/20 border-border/50 h-24 animate-pulse rounded-2xl" />

        {/* Continue Reading Card Skeleton */}
        <div className="glass-card p-6 mb-8 h-40 bg-muted/10 animate-pulse rounded-2xl border border-border/50" />

        {/* Quick Access Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-muted animate-pulse rounded-lg mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-muted/5 animate-pulse rounded-xl border border-border/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
