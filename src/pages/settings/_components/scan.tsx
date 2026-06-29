import { LibraryIcon } from "lucide-react";

import { useScan } from "@/components/scan-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

import { AddLibraryDialog } from "./add-library-dialog";
import { LibraryRow } from "./library-row";
import { SupportedFormats } from "./supported-formats";

export function Scan() {
  const {
    libraries,
    scans,
    activeLibraryId,
    progress,
    errorMessage,
    startScan,
    removeLibrary,
    renameLibrary,
  } = useScan();

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Your libraries</h2>
          <p className="text-sm text-muted-foreground">
            Each library is a named folder of one content type. Add as many as
            you like — they show up in the sidebar. Scans run in the background,
            so you can keep browsing.
          </p>
        </div>
        <AddLibraryDialog />
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Folder scan failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {libraries.length > 0 ? (
        <Card className="gap-0 divide-y overflow-hidden p-0">
          {libraries.map((library) => (
            <LibraryRow
              key={library.id}
              library={library}
              scan={scans[library.id]}
              isScanning={activeLibraryId === library.id}
              isAnyScanning={activeLibraryId !== null}
              progress={activeLibraryId === library.id ? progress : null}
              onRescan={() => void startScan(library.id)}
              onRemove={() => void removeLibrary(library.id)}
              onRename={(name) => void renameLibrary(library.id, name)}
            />
          ))}
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <LibraryIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No libraries yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first library and point it at a folder of manga, comics,
              books, or audiobooks.
            </p>
          </div>
          <AddLibraryDialog />
        </Card>
      )}

      <SupportedFormats />
    </section>
  );
}
