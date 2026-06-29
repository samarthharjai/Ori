import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { type LibraryItem, contentTypes } from "@/lib/library";

import { LibraryIcon } from "./library-icon";

interface CoverImageProps {
  item: LibraryItem;
}


const coverCache = new Map<string, string | null>();
const pendingLookups = new Map<string, Promise<string | null>>();

function resolveCover(sourcePath: string): Promise<string | null> {
  const cached = coverCache.get(sourcePath);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = pendingLookups.get(sourcePath);
  if (pending) return pending;

  const lookup = invoke<string | null>("get_archive_cover", {
    contentPath: sourcePath,
  })
    .then((result) => {
      const value = result ?? null;
      coverCache.set(sourcePath, value);
      pendingLookups.delete(sourcePath);
      return value;
    })
    .catch(() => {
      coverCache.set(sourcePath, null);
      pendingLookups.delete(sourcePath);
      return null;
    });

  pendingLookups.set(sourcePath, lookup);
  return lookup;
}

export function CoverImage({ item }: CoverImageProps) {
  const iconName = contentTypes[item.type]?.iconName ?? "book";

  const sourcePath = item.coverSourcePath;
  const cachedCover = sourcePath ? coverCache.get(sourcePath) : null;
  const containerRef = useRef<HTMLDivElement>(null);

  const [coverPath, setCoverPath] = useState<string | null>(cachedCover ?? null);
  // "resolving" only while we actually have a source to look up and no answer yet.
  const [isResolving, setIsResolving] = useState(
    Boolean(sourcePath) && cachedCover === undefined
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!sourcePath || coverCache.get(sourcePath) !== undefined) return;

    const element = containerRef.current;
    if (!element) return;

    let isActive = true;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        observer.disconnect();
        resolveCover(sourcePath).then((result) => {
          if (!isActive) return;
          setCoverPath(result);
          setIsResolving(false);
        });
      },
      { rootMargin: "300px" }
    );

    observer.observe(element);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [sourcePath]);

  const coverSrc = coverPath && !hasError ? convertFileSrc(coverPath) : null;

  return (
    <AspectRatio ratio={2 / 3} className="bg-muted" ref={containerRef}>
      {coverSrc ? (
        <img
          src={coverSrc}
          alt={`${item.title} cover`}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      ) : isResolving ? (
        <Skeleton className="size-full rounded-none" />
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
