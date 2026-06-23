import { FolderOpenIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";

import { LibraryIcon } from "@/components/library-grid/library-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  type ContentFolderScan,
  type ContentLibrary,
  type ScanProgress,
} from "@/lib/library";

interface LibraryFolderRowProps {
  library: ContentLibrary;
  scan?: ContentFolderScan;
  isScanning: boolean;
  progress?: ScanProgress | null;
  onSelect: () => void;
  onRefresh: () => void;
}

export function LibraryFolderRow({
  library,
  scan,
  isScanning,
  progress,
  onSelect,
  onRefresh,
}: LibraryFolderRowProps) {
  const percent =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <LibraryIcon name={library.iconName} className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="font-medium">{library.title}</p>
            {scan ? (
              <Badge variant="secondary">Configured</Badge>
            ) : (
              <Badge variant="outline">Not set</Badge>
            )}
          </div>

          {scan ? (
            <>
              <p className="truncate text-sm text-muted-foreground">
                {scan.rootPath}
              </p>
              <p className="text-xs text-muted-foreground">
                {scan.supportedFileCount} files · {scan.folderCount} folders
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {library.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {scan ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Refresh ${library.title}`}
              title="Rescan for new content"
              disabled={isScanning}
              onClick={onRefresh}
            >
              <RefreshCwIcon
                className={isScanning ? "animate-spin" : undefined}
              />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isScanning}
            onClick={onSelect}
          >
            {isScanning ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <FolderOpenIcon />
            )}
            {scan ? "Change" : "Select"}
          </Button>
        </div>
      </div>

      {isScanning && progress ? (
        <div className="space-y-1.5">
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">
            {progress.total > 0
              ? `Scanning ${progress.processed} of ${progress.total} files (${percent}%)`
              : "Preparing scan…"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
