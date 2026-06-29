import { invoke } from "@tauri-apps/api/core";

export type IconName = "book" | "headphones" | "image";

export const archiveExtensions = ["cbz", "cbr", "zip", "epub", "rar"];

export const supportedFormats = [
  "CBZ",
  "CBR",
  "PDF",
  "EPUB",
  "MOBI",
  "MP3",
  "M4B",
  "ZIP",
  "RAR",
];

export type ContentType =
  | "manga"
  | "comics"
  | "webtoons"
  | "books"
  | "audiobooks";

export interface ContentTypeInfo {
  label: string;
  description: string;
  iconName: IconName;
  formats: string[];
  unit: string;
  unitSingular: string;
}

export const contentTypes: Record<ContentType, ContentTypeInfo> = {
  manga: {
    label: "Manga",
    description: "Japanese manga series, volumes, and chapter archives.",
    iconName: "image",
    formats: ["CBZ", "CBR", "PDF", "ZIP", "RAR"],
    unit: "chapters",
    unitSingular: "chapter",
  },
  comics: {
    label: "Comics",
    description: "Comic runs, volumes, single issues, and collected editions.",
    iconName: "image",
    formats: ["CBZ", "CBR", "PDF", "ZIP", "RAR"],
    unit: "issues",
    unitSingular: "issue",
  },
  webtoons: {
    label: "Webtoons",
    description: "Long-strip webtoon folders, episode archives, and PDFs.",
    iconName: "image",
    formats: ["ZIP", "RAR", "CBZ", "PDF"],
    unit: "episodes",
    unitSingular: "episode",
  },
  books: {
    label: "Books",
    description: "Ebooks, novels, light novels, and PDFs.",
    iconName: "book",
    formats: ["EPUB", "MOBI", "PDF"],
    unit: "volumes",
    unitSingular: "volume",
  },
  audiobooks: {
    label: "Audiobooks",
    description: "Narrated books and audio collections.",
    iconName: "headphones",
    formats: ["MP3", "M4B"],
    unit: "tracks",
    unitSingular: "track",
  },
};

export const contentTypeOrder: ContentType[] = [
  "manga",
  "comics",
  "webtoons",
  "books",
  "audiobooks",
];

export interface Library {
  id: string;
  name: string;
  type: ContentType;
  folderPath: string;
}

export interface ContentFile {
  name: string;
  path: string;
  extension: string;
}

export interface ContentFolderScan {
  rootPath: string;
  folderCount: number;
  fileCount: number;
  supportedFileCount: number;
  supportedFiles: ContentFile[];
}

export type LibraryScans = Record<string, ContentFolderScan | undefined>;

export interface ScanProgress {
  processed: number;
  total: number;
  done: boolean;
  currentName?: string | null;
}

export interface ScanBatch {
  files: ContentFile[];
}

export interface LibraryItem {
  id: string;
  title: string;
  libraryId: string;
  libraryName: string;
  type: ContentType;
  rootPath: string;
  coverSourcePath?: string;
  files: ContentFile[];
  formats: string[];
  addedOrder: number;
}


export async function loadLibraries(): Promise<Library[]> {
  try {
    const raw = await invoke<string>("load_libraries");
    const parsed = JSON.parse(raw) as Library[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLibraries(libraries: Library[]): Promise<void> {
  await invoke("save_libraries", { data: JSON.stringify(libraries) });
}

export async function loadLibraryScans(): Promise<LibraryScans> {
  try {
    const raw = await invoke<string>("load_scans");
    return JSON.parse(raw) as LibraryScans;
  } catch {
    return {};
  }
}

export async function saveLibraryScans(scans: LibraryScans): Promise<void> {
  await invoke("save_scans", { data: JSON.stringify(scans) });
}

export function createLibraryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lib-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getLibraryItems(
  libraries: Library[],
  scans: LibraryScans
): LibraryItem[] {
  return libraries.flatMap((library) => {
    const scan = scans[library.id];

    if (!scan) return [];

    return groupScanFiles(library, scan);
  });
}

function groupScanFiles(library: Library, scan: ContentFolderScan) {
  const groupedFiles = new Map<string, { files: ContentFile[]; order: number }>();

  scan.supportedFiles.forEach((file, index) => {
    const title = getItemTitle(scan.rootPath, file);
    const group = groupedFiles.get(title);

    if (group) {
      group.files.push(file);
      group.order = Math.max(group.order, index);
    } else {
      groupedFiles.set(title, { files: [file], order: index });
    }
  });

  return Array.from(groupedFiles.entries()).map(([title, { files, order }]) => {
    const formats = Array.from(
      new Set(files.map((file) => file.extension.toUpperCase()))
    ).sort();

    return {
      id: `${library.id}:${title}`,
      title,
      libraryId: library.id,
      libraryName: library.name,
      type: library.type,
      rootPath: scan.rootPath,
      coverSourcePath: getCoverSourcePath(files),
      files,
      formats,
      addedOrder: order,
    } satisfies LibraryItem;
  });
}
function getCoverSourcePath(files: ContentFile[]): string | undefined {
  return files.find((file) =>
    archiveExtensions.includes(file.extension.toLowerCase())
  )?.path;
}

function getItemTitle(rootPath: string, file: ContentFile) {
  const relativePath = getRelativePath(rootPath, file.path);
  const parts = relativePath.split(/[\\/]+/).filter(Boolean);

  if (parts.length > 1) return parts[0];

  return removeExtension(file.name);
}

function getRelativePath(rootPath: string, filePath: string) {
  const normalizedRootPath = rootPath.replace(/[\\/]+$/, "");

  if (filePath.toLowerCase().startsWith(normalizedRootPath.toLowerCase())) {
    return filePath.slice(normalizedRootPath.length).replace(/^[\\/]+/, "");
  }

  return filePath;
}

function removeExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

export function groupItemsByLibrary(
  libraries: Library[],
  items: LibraryItem[]
) {
  return libraries
    .map((library) => ({
      library,
      items: items.filter((item) => item.libraryId === library.id),
    }))
    .filter((section) => section.items.length > 0);
}

export function getRecentlyAddedItems(items: LibraryItem[], limit = 20) {
  return [...items]
    .sort((left, right) => right.addedOrder - left.addedOrder)
    .slice(0, limit);
}

export function formatItemCount(count: number, type: ContentType) {
  const info = contentTypes[type];
  const unit = count === 1 ? info.unitSingular : info.unit;

  return `${count} ${unit}`;
}
