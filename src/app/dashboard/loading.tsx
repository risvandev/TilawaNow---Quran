export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-6 w-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-12 w-12 bg-muted animate-pulse rounded-full hidden md:block" />
        </div>

        {/* Khatmah Widget Skeleton */}
        <div className="glass-card p-6 mb-8 bg-muted/20 border-border/50 flex flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="h-12 w-40 bg-muted animate-pulse rounded-lg" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-3 md:p-6 border border-border/50 h-32 md:h-40 bg-muted/10 animate-pulse rounded-2xl" />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 overflow-hidden">
          <div className="lg:col-span-2 h-[400px] bg-muted/10 animate-pulse rounded-2xl" />
          <div className="h-[400px] bg-muted/10 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
