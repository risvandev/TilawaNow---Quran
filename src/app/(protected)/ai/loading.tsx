export default function AILoading() {
  return (
    <div className="min-h-screen bg-transparent pt-4 md:pt-16 pb-40">
      <div className="w-full md:max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-muted animate-pulse mb-4" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mb-3" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
        </div>

        {/* Suggestions Skeleton */}
        <div className="flex gap-2 py-2 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full shrink-0" />
          ))}
        </div>

        {/* Message Skeleton */}
        <div className="space-y-6">
          <div className="flex justify-start">
            <div className="h-20 w-2/3 bg-muted/10 animate-pulse rounded-2xl rounded-bl-none border border-border/50 shadow-md" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-1/3 bg-primary/20 animate-pulse rounded-2xl rounded-br-none border border-primary/10 shadow-md" />
          </div>
          <div className="flex justify-start">
            <div className="h-24 w-1/2 bg-muted/10 animate-pulse rounded-2xl rounded-bl-none border border-border/50 shadow-md" />
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">
          <div className="h-14 w-full bg-muted/20 animate-pulse rounded-2xl border border-border/50" />
        </div>
      </div>
    </div>
  );
}
