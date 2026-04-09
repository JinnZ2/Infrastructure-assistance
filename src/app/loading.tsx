import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden dark">
      <aside className="w-[350px] flex flex-col border-r bg-card/30 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}
