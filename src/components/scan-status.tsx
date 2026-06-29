import { CheckCircle2Icon, FolderOpenIcon, Loader2Icon, ScanLineIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { useScan } from "@/components/scan-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";

export function ScanStatus() {
  const { libraries, scans, activeLibraryId, progress } = useScan();

  const activeLibrary = activeLibraryId
    ? libraries.find((library) => library.id === activeLibraryId)
    : null;
  const isScanning = Boolean(activeLibrary);
  const isPreparing = isScanning && (!progress || progress.total === 0);
  const percent =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  const configured = libraries
    .map((library) => ({ library, scan: scans[library.id] }))
    .filter((entry) => entry.scan);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isScanning ? "Scan in progress" : "Library scans"}
          className="relative shrink-0"
        >
          {isScanning ? (
            <Loader2Icon className="size-4 animate-spin text-primary" />
          ) : (
            <ScanLineIcon className="size-4" />
          )}
          {isScanning ? (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-3">
        {isScanning ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
              <p className="min-w-0 flex-1 truncate font-medium">
                Scanning {activeLibrary?.name}
              </p>
              {!isPreparing ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {percent}%
                </span>
              ) : null}
            </div>

            {isPreparing ? (
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-[scanner_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
              </div>
            ) : (
              <Progress value={percent} />
            )}

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {isPreparing
                  ? "Counting files…"
                  : progress?.currentName
                    ? `Processing ${progress.currentName}`
                    : "Processing…"}
              </span>
              {!isPreparing ? (
                <span className="shrink-0 tabular-nums">
                  {progress?.processed ?? 0}/{progress?.total ?? 0}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 shrink-0 text-muted-foreground" />
              <p className="font-medium">No scan running</p>
            </div>

            {configured.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {configured.map(({ library, scan }) => (
                  <li
                    key={library.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate text-foreground">
                      {library.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {scan?.supportedFileCount ?? 0} files
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No folders scanned yet. Add a folder in settings to build your
                library.
              </p>
            )}

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/settings">
                <FolderOpenIcon />
                Manage folders
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
