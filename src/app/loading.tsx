export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full h-full animate-fade-in">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-muted-foreground text-sm font-medium animate-pulse italic">Bismillah...</p>
    </div>
  );
}
