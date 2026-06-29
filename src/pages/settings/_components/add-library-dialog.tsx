import { open } from "@tauri-apps/plugin-dialog";
import { FolderIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { useScan } from "@/components/scan-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ContentType,
  contentTypeOrder,
  contentTypes,
} from "@/lib/library";

export function AddLibraryDialog() {
  const { addLibrary, activeLibraryId } = useScan();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ContentType>("manga");
  const [folderPath, setFolderPath] = useState<string | null>(null);

  function reset() {
    setName("");
    setType("manga");
    setFolderPath(null);
  }

  async function handlePickFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select library folder",
    });

    if (!selected || Array.isArray(selected)) return;

    setFolderPath(selected);

    // Pre-fill the name with the folder's own name as a sensible default.
    if (!name.trim()) {
      const segments = selected.split(/[\\/]+/).filter(Boolean);
      setName(segments[segments.length - 1] ?? "");
    }
  }

  async function handleCreate() {
    if (!folderPath) return;

    await addLibrary({ name, type, folderPath });
    reset();
    setIsOpen(false);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={Boolean(activeLibraryId)}>
          <PlusIcon />
          Add library
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a library</DialogTitle>
          <DialogDescription>
            Name it whatever you like and point it at a folder. Create separate
            libraries for things like Marvel, DC, or your manga.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="library-name">Name</Label>
            <Input
              id="library-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Marvel"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-type">Content type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ContentType)}
            >
              <SelectTrigger id="library-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOrder.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contentTypes[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {contentTypes[type].description}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Folder</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={handlePickFolder}
            >
              <FolderIcon />
              <span className="min-w-0 flex-1 truncate text-left">
                {folderPath ?? "Choose a folder…"}
              </span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleCreate} disabled={!folderPath}>
            Create &amp; scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
