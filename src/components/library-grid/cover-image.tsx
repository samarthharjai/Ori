import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { type LibraryItem, contentLibraries } from "@/lib/library";

import { LibraryIcon } from "./library-icon";

interface CoverImageProps {
  item: LibraryItem;
}

export function CoverImage({ item }: CoverImageProps) {
  const library = contentLibraries.find(
    (library) => library.id === item.libraryId
  );
  const iconName = library?.iconName ?? "book";
  const [hasError, setHasError] = useState(false);

  const coverSrc =
    item.coverPath && !hasError ? convertFileSrc(item.coverPath) : null;

  return (
    <AspectRatio ratio={2 / 3} className="bg-muted">
      {coverSrc ? (
        <img
          src={coverSrc}
          alt={`${item.title} cover`}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-linear-to-br from-muted to-muted/40 p-4 text-center">
          <LibraryIcon name={iconName} className="size-9 text-muted-foreground" />
          <div className="space-y-1">
            <p className="line-clamp-3 text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">No cover found</p>
          </div>
        </div>
      )}
    </AspectRatio>
  );
}
