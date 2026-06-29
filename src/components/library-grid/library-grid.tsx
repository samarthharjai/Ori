import { type LibraryItem } from "@/lib/library";

import { LibraryCard } from "./library-card";

interface LibraryGridProps {
  items: LibraryItem[];
  emptyTitle?: string;
}

export function LibraryGrid({
  items,
  emptyTitle = "No content found",
}: LibraryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {emptyTitle}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 min-[640px]:grid-cols-4 min-[900px]:grid-cols-5 min-[1100px]:grid-cols-6 min-[1400px]:grid-cols-7">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
