import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";

interface ResultsHeaderProps {
  total: number;
  page: number;
  limit: number;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  MAISONETTE: "Maisonette",
  VILLA: "Villa",
  STUDIO: "Studio",
  BUNGALOW: "Bungalow",
  DUPLEX: "Duplex",
  PENTHOUSE: "Penthouse",
  TOWNHOUSE: "Townhouse",
};

const NATURE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED: "Mixed Use",
};

const SORT_LABELS: Record<string, string> = {
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export default function ResultsHeader({ total, page, limit }: ResultsHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = searchParams.get("type") ?? "";
  const location = searchParams.get("location") ?? "";
  const propertyType = searchParams.get("propertyType") ?? "";
  const nature = searchParams.get("nature") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "";

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function removeParam(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      next.set("page", "1");
      return next;
    });
  }

  const chips: { key: string; label: string }[] = [];
  if (type === "RENTAL") chips.push({ key: "type", label: "For Rent" });
  else if (type === "SALE") chips.push({ key: "type", label: "For Sale" });
  if (propertyType && PROPERTY_TYPE_LABELS[propertyType])
    chips.push({ key: "propertyType", label: PROPERTY_TYPE_LABELS[propertyType] });
  if (nature && NATURE_LABELS[nature])
    chips.push({ key: "nature", label: NATURE_LABELS[nature] });
  if (location) chips.push({ key: "location", label: location });
  if (minPrice) chips.push({ key: "minPrice", label: `From KES ${Number(minPrice).toLocaleString()}` });
  if (maxPrice) chips.push({ key: "maxPrice", label: `Up to KES ${Number(maxPrice).toLocaleString()}` });
  if (sort && SORT_LABELS[sort]) chips.push({ key: "sort", label: SORT_LABELS[sort] });

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 min-h-[32px]">
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        {total === 0 ? (
          "No properties found"
        ) : (
          <>
            <span className="font-medium text-foreground">{from}–{to}</span>
            {" of "}
            <span className="font-medium text-foreground">{total.toLocaleString()}</span>
            {" properties"}
          </>
        )}
      </p>

      {chips.length > 0 && (
        <span className="text-muted-foreground/40 text-sm select-none">·</span>
      )}

      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeParam(chip.key)}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-primary/8 text-primary border border-primary/20
            hover:bg-destructive/8 hover:text-destructive hover:border-destructive/20
            transition-colors duration-150"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
