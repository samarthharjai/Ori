import { Badge } from "@/components/ui/badge";
import { supportedFormats } from "@/lib/library";

export function SupportedFormats() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-muted/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">Supported formats</span>
      <div className="flex flex-wrap gap-1.5">
        {supportedFormats.map((format) => (
          <Badge key={format} variant="secondary">
            {format}
          </Badge>
        ))}
      </div>
    </div>
  );
}
