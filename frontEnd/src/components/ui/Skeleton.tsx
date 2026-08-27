import { cn } from "../../utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-active", className)} />;
}

export function ConversationItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function MessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={cn("flex items-end gap-2 px-4", align === "right" && "flex-row-reverse")}>
      {align === "left" && <Skeleton className="h-7 w-7 shrink-0 rounded-full" />}
      <Skeleton className={cn("h-9", align === "right" ? "w-40" : "w-56")} />
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <MessageSkeleton align="left" />
      <MessageSkeleton align="right" />
      <MessageSkeleton align="left" />
      <MessageSkeleton align="left" />
      <MessageSkeleton align="right" />
    </div>
  );
}
