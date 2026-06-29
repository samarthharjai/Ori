import { type LibraryItem, formatItemCount } from "@/lib/library";

import { CoverImage } from "./cover-image";

interface LibraryCardProps {
  item: LibraryItem;
}

export function LibraryCard({ item }: LibraryCardProps) {
  const fileCount = item.files.length;
  const subtitle = fileCount > 0 ? formatItemCount(fileCount, item.type) : null;

  return (
    <button
      type="button"
      title={item.title}
      className="group flex w-full flex-col gap-2 text-left focus:outline-none"
    >
      <div className="relative overflow-hidden rounded-md ring-1 ring-white/10 transition duration-200 group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <CoverImage item={item} />

        {fileCount > 1 ? (
          <span
            className="absolute top-1.5 right-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums shadow-sm"
            aria-label={subtitle ?? undefined}
          >
            {fileCount}
          </span>
        ) : null}
      </div>

      <div className="space-y-0.5 px-0.5">
        <span className="block truncate text-sm leading-tight font-medium">
          {item.title}
        </span>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}
