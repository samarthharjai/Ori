import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  type ContentFolderScan,
  type LibraryScans,
  type ScanProgress,
  contentLibraries,
  getStoredLibraryScans,
  setStoredLibraryScan,
} from "@/lib/library";

import { LibraryFolderRow } from "./library-folder-row";
import { SupportedFormats } from "./supported-formats";

export function Scan() {
  const [folderScans, setFolderScans] = useState<LibraryScans>(() =>
    getStoredLibraryScans()
  );
  const [isScanningId, setIsScanningId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runScan(libraryId: string, folderPath: string) {
    setErrorMessage(null);
    setIsScanningId(libraryId);
    setProgress({ processed: 0, total: 0 });

    const unlisten = await listen<ScanProgress>("scan-progress", (event) => {
      setProgress(event.payload);
    });

    try {
      const scan = await invoke<ContentFolderScan>("scan_content_folder", {
        folderPath,
      });

      setFolderScans((currentScans) =>
        setStoredLibraryScan(currentScans, libraryId, scan)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to read that folder."
      );
    } finally {
      unlisten();
      setProgress(null);
      setIsScanningId(null);
    }
  }

  async function handleSelectFolder(libraryId: string) {
    const library = contentLibraries.find((item) => item.id === libraryId);

    if (!library) return;

    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: `Select ${library.title} folder`,
    });

    if (!selectedPath || Array.isArray(selectedPath)) return;

    await runScan(libraryId, selectedPath);
  }

  function handleRefreshFolder(libraryId: string) {
    const scan = folderScans[libraryId];

    if (!scan) return;

    void runScan(libraryId, scan.rootPath);
  }

  const configuredCount = contentLibraries.filter(
    (library) => folderScans[library.id]
  ).length;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Content libraries</h2>
          <p className="text-sm text-muted-foreground">
            Point each content type at its folder. Nested folders are scanned
            automatically.
          </p>
        </div>
        <Badge variant="secondary">
          {configuredCount}/{contentLibraries.length} set
        </Badge>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Folder scan failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 divide-y overflow-hidden p-0">
        {contentLibraries.map((library) => (
          <LibraryFolderRow
            key={library.id}
            library={library}
            scan={folderScans[library.id]}
            isScanning={isScanningId === library.id}
            progress={isScanningId === library.id ? progress : null}
            onSelect={() => handleSelectFolder(library.id)}
            onRefresh={() => handleRefreshFolder(library.id)}
          />
        ))}
      </Card>

      <SupportedFormats />
    </section>
  );
}
