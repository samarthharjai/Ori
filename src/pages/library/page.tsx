import { BookOpenIcon, FolderOpenIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { LibraryGrid } from "@/components/library-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLibraryItems, getStoredLibraryScans } from "@/lib/library";

const LibraryPage = () => {
  const scans = getStoredLibraryScans();
  const libraryItems = getLibraryItems(scans);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {libraryItems.length > 0 ? (
        <LibraryGrid items={libraryItems} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <BookOpenIcon className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-medium">No library content yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Select and scan folders in settings first. After a scan, your
                manga, comics, webtoons, books, and audiobooks will appear here.
              </p>
            </div>
            <Button asChild>
              <Link to="/settings">
                <FolderOpenIcon />
                Set up folders
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LibraryPage;
