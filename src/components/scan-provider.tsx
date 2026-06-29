import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  type ContentFile,
  type ContentFolderScan,
  type ContentType,
  type Library,
  type LibraryScans,
  type ScanBatch,
  type ScanProgress,
  createLibraryId,
  loadLibraries,
  loadLibraryScans,
  saveLibraries,
  saveLibraryScans,
} from "@/lib/library";

interface AddLibraryInput {
  name: string;
  type: ContentType;
  folderPath: string;
}

interface ScanContextValue {
  libraries: Library[];
  scans: LibraryScans;
  isLoaded: boolean;
  activeLibraryId: string | null;
  progress: ScanProgress | null;
  errorMessage: string | null;
  addLibrary: (input: AddLibraryInput) => Promise<void>;
  removeLibrary: (libraryId: string) => Promise<void>;
  renameLibrary: (libraryId: string, name: string) => Promise<void>;
  startScan: (libraryId: string) => Promise<void>;
  clearError: () => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);


const LIVE_FLUSH_INTERVAL = 500;

function buildPartialScan(
  rootPath: string,
  files: ContentFile[]
): ContentFolderScan {
  return {
    rootPath,
    folderCount: 0,
    fileCount: files.length,
    supportedFileCount: files.length,
    supportedFiles: files,
  };
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [scans, setScans] = useState<LibraryScans>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const librariesRef = useRef<Library[]>([]);
  const scansRef = useRef<LibraryScans>({});
  const activeLibraryRef = useRef<string | null>(null);
  const activeRootRef = useRef<string>("");
  const liveFilesRef = useRef<ContentFile[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyLibraries = useCallback((next: Library[], persist: boolean) => {
    librariesRef.current = next;
    setLibraries(next);
    if (persist) void saveLibraries(next);
  }, []);

  const applyScans = useCallback((next: LibraryScans, persist: boolean) => {
    scansRef.current = next;
    setScans(next);
    if (persist) void saveLibraryScans(next);
  }, []);

  const flushLiveFiles = useCallback(() => {
    flushTimerRef.current = null;

    const libraryId = activeLibraryRef.current;
    if (!libraryId) return;

    const partial = buildPartialScan(activeRootRef.current, [
      ...liveFilesRef.current,
    ]);

    applyScans({ ...scansRef.current, [libraryId]: partial }, false);
  }, [applyScans]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(flushLiveFiles, LIVE_FLUSH_INTERVAL);
  }, [flushLiveFiles]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadLibraries(), loadLibraryScans()]).then(
      ([loadedLibraries, loadedScans]) => {
        if (!isMounted) return;
        librariesRef.current = loadedLibraries;
        scansRef.current = loadedScans;
        setLibraries(loadedLibraries);
        setScans(loadedScans);
        setIsLoaded(true);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Global listeners keep a scan alive regardless of which page is mounted, so
  // the user can navigate freely while it runs.
  useEffect(() => {
    const progressPromise = listen<ScanProgress>("scan-progress", (event) => {
      if (!activeLibraryRef.current) return;
      setProgress(event.payload);
    });

    const batchPromise = listen<ScanBatch>("scan-batch", (event) => {
      if (!activeLibraryRef.current) return;
      liveFilesRef.current.push(...event.payload.files);
      scheduleFlush();
    });

    return () => {
      progressPromise.then((unlisten) => unlisten());
      batchPromise.then((unlisten) => unlisten());
    };
  }, [scheduleFlush]);

  const startScan = useCallback(
    async (libraryId: string) => {
      if (activeLibraryRef.current) return;

      const library = librariesRef.current.find((item) => item.id === libraryId);
      if (!library) return;

      setErrorMessage(null);
      activeLibraryRef.current = libraryId;
      activeRootRef.current = library.folderPath;
      liveFilesRef.current = [];
      setActiveLibraryId(libraryId);
      setProgress({ processed: 0, total: 0, done: false, currentName: null });

      try {
        const scan = await invoke<ContentFolderScan>("scan_content_folder", {
          folderPath: library.folderPath,
        });

        applyScans({ ...scansRef.current, [libraryId]: scan }, true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : String(error ?? "Scan failed.")
        );
      } finally {
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        liveFilesRef.current = [];
        activeLibraryRef.current = null;
        setActiveLibraryId(null);
        setProgress(null);
      }
    },
    [applyScans]
  );

  const addLibrary = useCallback(
    async ({ name, type, folderPath }: AddLibraryInput) => {
      const library: Library = {
        id: createLibraryId(),
        name: name.trim() || "Untitled library",
        type,
        folderPath,
      };

      applyLibraries([...librariesRef.current, library], true);
      await startScan(library.id);
    },
    [applyLibraries, startScan]
  );

  const removeLibrary = useCallback(
    async (libraryId: string) => {
      applyLibraries(
        librariesRef.current.filter((library) => library.id !== libraryId),
        true
      );

      const nextScans = { ...scansRef.current };
      delete nextScans[libraryId];
      applyScans(nextScans, true);
    },
    [applyLibraries, applyScans]
  );

  const renameLibrary = useCallback(
    async (libraryId: string, name: string) => {
      applyLibraries(
        librariesRef.current.map((library) =>
          library.id === libraryId
            ? { ...library, name: name.trim() || library.name }
            : library
        ),
        true
      );
    },
    [applyLibraries]
  );

  const clearError = useCallback(() => setErrorMessage(null), []);

  return (
    <ScanContext.Provider
      value={{
        libraries,
        scans,
        isLoaded,
        activeLibraryId,
        progress,
        errorMessage,
        addLibrary,
        removeLibrary,
        renameLibrary,
        startScan,
        clearError,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);

  if (!context) {
    throw new Error("useScan must be used within a ScanProvider.");
  }

  return context;
}
