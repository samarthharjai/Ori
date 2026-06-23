import { BookOpenIcon, HeadphonesIcon, ImageIcon } from "lucide-react";
import type { ComponentType } from "react";

import type { ContentLibrary } from "@/lib/library";

export const libraryIcons = {
  book: BookOpenIcon,
  headphones: HeadphonesIcon,
  image: ImageIcon,
} satisfies Record<
  ContentLibrary["iconName"],
  ComponentType<{ className?: string }>
>;

interface LibraryIconProps {
  name: ContentLibrary["iconName"];
  className?: string;
}

export function LibraryIcon({ name, className }: LibraryIconProps) {
  const Icon = libraryIcons[name];

  return <Icon className={className} />;
}
