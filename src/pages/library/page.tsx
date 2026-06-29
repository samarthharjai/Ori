import { ArrowLeftIcon, BookOpenIcon, FolderOpenIcon } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { LibraryCarousel, LibraryGrid } from "@/components/library-grid";
import { useScan } from "@/components/scan-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLibraryItems,
  groupItemsByLibrary,
} from "@/lib/library";

const LibraryPage = () => {
  const { sectionId } = useParams();
  const { libraries, scans } = useScan();
  const libraryItems = useMemo(
    () => getLibraryItems(libraries, scans),
    [libraries, scans]
  );
  const sections = useMemo(
    () => groupItemsByLibrary(libraries, libraryItems),
    [libraries, libraryItems]
  );

  if (sectionId) {
    const library = libraries.find((item) => item.id === sectionId);
    const sectionItems = libraryItems.filter(
      (item) => item.libraryId === sectionId
    );

    if (!library) {
      return (
        <div className="flex w-full min-w-0 flex-col gap-4">
          <Button asChild variant="ghost" className="w-fit px-0">
            <Link to="/library">
              <ArrowLeftIcon />
              Back to library
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Library not found.</p>
        </div>
      );
    }

    return (
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="w-fit px-0">
            <Link to="/library">
              <ArrowLeftIcon />
              Back to library
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {library.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sectionItems.length} title
              {sectionItems.length === 1 ? "" : "s"} in {library.name}.
            </p>
          </div>
        </div>

        {sectionItems.length > 0 ? (
          <LibraryGrid items={sectionItems} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
              No content found in {library.name}.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      {sections.length > 0 ? (
        <div className="flex flex-col gap-8">
          {sections.map(({ library, items }) => (
            <LibraryCarousel
              key={library.id}
              title={library.name}
              items={items}
              libraryId={library.id}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <BookOpenIcon className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-medium">No libraries yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a library in settings and point it at a folder. Name it
                whatever you like — “Marvel”, “DC”, “Manga” — and it will appear
                here and in the sidebar.
              </p>
            </div>
            <Button asChild>
              <Link to="/settings">
                <FolderOpenIcon />
                Add a library
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LibraryPage;
