import { useSearchParams } from "react-router-dom";

interface ResultsHeaderProps {
  total: number;
  page: number;
  limit: number;
}

export default function ResultsHeader({ total, page, limit }: ResultsHeaderProps) {
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type");
  const location = searchParams.get("location");
  const propertyType = searchParams.get("propertyType");

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build a human-friendly filter summary
  const parts: string[] = [];
  if (type === "RENTAL") parts.push("Rentals");
  else if (type === "SALE") parts.push("For Sale");
  if (propertyType) parts.push(propertyType + "s");
  if (location) parts.push(`in ${location}`);

  const summary = parts.length > 0 ? ` · ${parts.join(" ")}` : "";

  return (
    <div className="flex items-center justify-between mb-5">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          "No properties found"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            properties
            <span>{summary}</span>
          </>
        )}
      </p>
    </div>
  );
}
