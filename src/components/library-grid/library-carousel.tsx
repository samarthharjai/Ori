import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { type LibraryItem } from "@/lib/library";

import { LibraryCard } from "./library-card";

interface LibraryCarouselProps {
  title: string;
  items: LibraryItem[];
  libraryId?: string;
  showMoreHref?: string;
  previewCount?: number;
}

export function LibraryCarousel({
  title,
  items,
  libraryId,
  showMoreHref,
  previewCount = 12,
}: LibraryCarouselProps) {
  if (items.length === 0) return null;

  const previewItems = items.slice(0, previewCount);
  const moreHref = showMoreHref ?? (libraryId ? `/library/${libraryId}` : undefined);

  return (
    <section className="min-w-0 w-full">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="min-w-0 w-full"
      >
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-lg font-medium">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1.5">
            {moreHref ? (
              <Badge variant="outline" asChild className="h-6 shrink-0 px-2.5">
                <Link to={moreHref}>Show more</Link>
              </Badge>
            ) : null}
            <CarouselPrevious className="static size-8 shrink-0 translate-x-0 translate-y-0" />
            <CarouselNext className="static size-8 shrink-0 translate-x-0 translate-y-0" />
          </div>
        </div>

        <CarouselContent className="ml-0 gap-3 py-1">
          {previewItems.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-[38%] pl-0 min-[480px]:basis-[32%] min-[640px]:basis-[24%] min-[900px]:basis-[18%] min-[1200px]:basis-[14%]"
            >
              <LibraryCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
