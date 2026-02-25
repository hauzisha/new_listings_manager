import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  "Apartment",
  "Maisonette",
  "Villa",
  "Studio",
  "Bungalow",
  "Duplex",
  "Penthouse",
  "Townhouse",
  "Commercial",
  "Land",
];

const LISTING_TYPES = [
  { label: "All", value: "" },
  { label: "For Sale", value: "SALE" },
  { label: "For Rent", value: "RENTAL" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentType = searchParams.get("type") ?? "";
  const currentLocation = searchParams.get("location") ?? "";
  const currentPropertyType = searchParams.get("propertyType") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";

  const [locationInput, setLocationInput] = useState<string>(currentLocation);

  // Debounce location input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (locationInput) {
          next.set("location", locationInput);
        } else {
          next.delete("location");
        }
        next.set("page", "1");
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [locationInput, setSearchParams]);

  // Sync locationInput if URL param changes externally (e.g. hero search)
  useEffect(() => {
    setLocationInput(searchParams.get("location") ?? "");
  }, [searchParams.get("location")]);

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set("page", "1");
      return next;
    });
  }

  const hasActiveFilters =
    currentType !== "" ||
    currentLocation !== "" ||
    currentPropertyType !== "" ||
    currentMinPrice !== "" ||
    currentMaxPrice !== "" ||
    currentSort !== "newest";

  function clearFilters() {
    setLocationInput("");
    setSearchParams({});
  }

  return (
    <div className="sticky top-16 z-40 bg-white/98 backdrop-blur-sm border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter icon label (desktop only) */}
          <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground font-medium mr-1 flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </div>

          {/* Location search */}
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Location..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="pl-8 h-9 text-sm bg-muted/40 border-border/60"
            />
          </div>

          {/* Listing type toggles */}
          <div className="flex items-center rounded-lg border border-border/60 overflow-hidden bg-muted/30 flex-shrink-0">
            {LISTING_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setParam("type", t.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap",
                  currentType === t.value
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Property type */}
          <Select
            value={currentPropertyType || "all"}
            onValueChange={(val) => setParam("propertyType", val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 text-sm w-[140px] bg-muted/40 border-border/60 flex-shrink-0">
              <SelectValue placeholder="Property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Min price */}
          <Input
            type="number"
            placeholder="Min price"
            value={currentMinPrice}
            onChange={(e) => setParam("minPrice", e.target.value)}
            className="h-9 text-sm w-[110px] bg-muted/40 border-border/60 flex-shrink-0"
          />

          {/* Max price */}
          <Input
            type="number"
            placeholder="Max price"
            value={currentMaxPrice}
            onChange={(e) => setParam("maxPrice", e.target.value)}
            className="h-9 text-sm w-[110px] bg-muted/40 border-border/60 flex-shrink-0"
          />

          {/* Sort */}
          <Select
            value={currentSort}
            onValueChange={(val) => setParam("sort", val)}
          >
            <SelectTrigger className="h-9 text-sm w-[170px] bg-muted/40 border-border/60 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
