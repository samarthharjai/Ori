import { PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { LibraryIcon } from "@/components/library-grid/library-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  type ContentFolderScan,
  type Library,
  type ScanProgress,
  contentTypes,
} from "@/lib/library";

interface LibraryRowProps {
  library: Library;
  scan?: ContentFolderScan;
  isScanning: boolean;
  isAnyScanning: boolean;
  progress?: ScanProgress | null;
  onRescan: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
}

export function LibraryRow({
  library,
  scan,
  isScanning,
  isAnyScanning,
  progress,
  onRescan,
  onRemove,
  onRename,
}: LibraryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(library.name);

  const typeInfo = contentTypes[library.type];
  const percent =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;
  const isPreparing = isScanning && (!progress || progress.total === 0);

  function commitRename() {
    setIsEditing(false);
    const next = draftName.trim();
    if (next && next !== library.name) onRename(next);
    else setDraftName(library.name);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <LibraryIcon name={typeInfo.iconName} className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitRename();
                  if (event.key === "Escape") {
                    setDraftName(library.name);
                    setIsEditing(false);
                  }
                }}
                className="h-7 max-w-56"
              />
            ) : (
              <>
                <p className="truncate font-medium">{library.name}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Rename library"
                  onClick={() => {
                    setDraftName(library.name);
                    setIsEditing(true);
                  }}
                >
                  <PencilIcon className="size-3.5 text-muted-foreground" />
                </Button>
              </>
            )}
            <Badge variant="secondary" className="shrink-0">
              {typeInfo.label}
            </Badge>
          </div>

          <p className="truncate text-sm text-muted-foreground">
            {library.folderPath}
          </p>
          {scan ? (
            <p className="text-xs text-muted-foreground">
              {scan.supportedFileCount} files · {scan.folderCount} folders
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Not scanned yet</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Rescan ${library.name}`}
            title="Rescan for new content"
            disabled={isAnyScanning}
            onClick={onRescan}
          >
            <RefreshCwIcon className={isScanning ? "animate-spin" : undefined} />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${library.name}`}
                title="Remove library"
                disabled={isAnyScanning}
              >
                <Trash2Icon className="text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {library.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the library from mangareader. Your files on disk
                  are not touched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isScanning ? (
        <div className="space-y-1.5">
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">
            {isPreparing
              ? "Preparing scan…"
              : `Scanning ${progress?.processed ?? 0} of ${progress?.total ?? 0} files (${percent}%)`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
