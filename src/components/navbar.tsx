import { SearchIcon, XIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSearch } from "@/components/search-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleSearchChange(value: string) {
    setSearchTerm(value);

    if (value && pathname !== "/") navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-5"
      />
      <div className="relative w-full max-w-xl">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search your library"
          aria-label="Search"
          className="pr-8 pl-8"
        />
        {searchTerm ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => setSearchTerm("")}
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
