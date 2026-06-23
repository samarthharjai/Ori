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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
