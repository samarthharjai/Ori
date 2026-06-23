import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { type LibraryItem } from "@/lib/library";

import { CoverImage } from "./cover-image";

interface LibraryCardProps {
  item: LibraryItem;
}

export function LibraryCard({ item }: LibraryCardProps) {
  return (
    <Card className="gap-2 overflow-hidden py-0">
      <CoverImage item={item} />
      <CardHeader className="px-3 pb-3">
        <CardTitle className="truncate text-sm">{item.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}
