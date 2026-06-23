import { SearchXIcon } from "lucide-react";

import { LibraryGrid } from "@/components/library-grid";
import { useSearch } from "@/components/search-provider";
import { Card, CardContent } from "@/components/ui/card";
import { getLibraryItems, getStoredLibraryScans } from "@/lib/library";

const HomePage = () => {
  const { searchTerm } = useSearch();
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">
          Search from the bar above to find manga, comics, webtoons, books, and
          audiobooks across your library.
        </p>
      </div>
    );
  }

  const libraryItems = getLibraryItems(getStoredLibraryScans());
  const results = libraryItems.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedTerm) ||
      item.libraryTitle.toLowerCase().includes(normalizedTerm)
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
