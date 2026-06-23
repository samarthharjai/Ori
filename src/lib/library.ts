export const libraryStorageKey = "mangareader:library-scans";

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

export const contentLibraries = [
  {
    id: "manga",
    title: "Manga",
    description: "Japanese manga series, volumes, and chapter archives.",
    example: "Manga / Dragon Ball / Chapter 001.cbz",
    formats: ["CBZ", "CBR", "PDF", "ZIP", "RAR"],
    iconName: "image",
  },
  {
    id: "comics",
    title: "Comics",
    description: "Comic runs, volumes, single issues, and collected editions.",
    example: "Comics / Batman / Issue 001.cbr",
    formats: ["CBZ", "CBR", "PDF", "ZIP", "RAR"],
    iconName: "image",
  },
  {
    id: "webtoons",
    title: "Webtoons",
    description: "Long-strip webtoon folders, episode archives, and PDFs.",
    example: "Webtoons / Solo Leveling / Episode 001.zip",
    formats: ["ZIP", "RAR", "CBZ", "PDF"],
    iconName: "image",
  },
  {
    id: "books",
    title: "Books",
    description: "Regular ebooks, novels, light novels, and PDFs.",
    example: "Books / Brandon Sanderson / Mistborn.epub",
    formats: ["EPUB", "MOBI", "PDF"],
    iconName: "book",
  },
  {
    id: "audiobooks",
    title: "Audiobooks",
    description: "Narrated books and audio collections.",
    example: "Audiobooks / Dune / Dune.m4b",
    formats: ["MP3", "M4B"],
    iconName: "headphones",
  },
] satisfies ContentLibrary[];

export interface ContentLibrary {
  id: string;
  title: string;
  description: string;
  example: string;
  formats: string[];
  iconName: "book" | "headphones" | "image";
}

export interface ContentFile {
  name: string;
  path: string;
  extension: string;
  coverPath?: string | null;
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
}

export interface LibraryItem {
  id: string;
  title: string;
  libraryId: string;
  libraryTitle: string;
  rootPath: string;
  coverPath?: string | null;
  files: ContentFile[];
  formats: string[];
}

export function getStoredLibraryScans(): LibraryScans {
  const storedValue = window.localStorage.getItem(libraryStorageKey);

  if (!storedValue) return {};

  try {
    return JSON.parse(storedValue) as LibraryScans;
  } catch {
    return {};
  }
}

export function setStoredLibraryScans(scans: LibraryScans) {
  window.localStorage.setItem(libraryStorageKey, JSON.stringify(scans));
}

export function setStoredLibraryScan(
  scans: LibraryScans,
  libraryId: string,
  scan: ContentFolderScan
) {
  const nextScans = {
    ...scans,
    [libraryId]: scan,
  };

  setStoredLibraryScans(nextScans);

  return nextScans;
}

export function getLibraryItems(scans: LibraryScans) {
  return contentLibraries.flatMap((library) => {
    const scan = scans[library.id];

    if (!scan) return [];

    return groupScanFiles(library, scan);
  });
}

function groupScanFiles(library: ContentLibrary, scan: ContentFolderScan) {
  const groupedFiles = new Map<string, ContentFile[]>();

  for (const file of scan.supportedFiles) {
    const title = getItemTitle(scan.rootPath, file);
    const files = groupedFiles.get(title) ?? [];

    files.push(file);
    groupedFiles.set(title, files);
  }

  return Array.from(groupedFiles.entries()).map(([title, files]) => {
    const formats = Array.from(
      new Set(files.map((file) => file.extension.toUpperCase()))
    ).sort();

    return {
      id: `${library.id}:${title}`,
      title,
      libraryId: library.id,
      libraryTitle: library.title,
      rootPath: scan.rootPath,
      coverPath: files.find((file) => file.coverPath)?.coverPath,
      files,
      formats,
    } satisfies LibraryItem;
  });
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
