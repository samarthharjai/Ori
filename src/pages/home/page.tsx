import { SearchXIcon } from "lucide-react";
import { useMemo } from "react";

import { LibraryCarousel, LibraryGrid } from "@/components/library-grid";
import { useScan } from "@/components/scan-provider";
import { useSearch } from "@/components/search-provider";
import { Card, CardContent } from "@/components/ui/card";
import { getLibraryItems, getRecentlyAddedItems } from "@/lib/library";

const HomePage = () => {
  const { searchTerm } = useSearch();
  const { libraries, scans } = useScan();
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const libraryItems = useMemo(
    () => getLibraryItems(libraries, scans),
    [libraries, scans]
  );
  const recentlyAdded = useMemo(
    () => getRecentlyAddedItems(libraryItems),
    [libraryItems]
  );

  if (!normalizedTerm) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-8">
        {recentlyAdded.length > 0 ? (
          <LibraryCarousel
            title="Recently added"
            items={recentlyAdded}
            showMoreHref="/library"
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">Nothing here yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Scan folders in settings to populate your library.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const results = libraryItems.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedTerm) ||
      item.libraryName.toLowerCase().includes(normalizedTerm)
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Search results</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"} for “
          {searchTerm}”
        </p>
      </div>

      {results.length > 0 ? (
        <LibraryGrid items={results} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <SearchXIcon className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-medium">No matches</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Nothing in your library matches “{searchTerm}”.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomePage;
