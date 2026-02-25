import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Home, AlertCircle, MapPin, TrendingUp, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";
import MarketplaceNav from "@/components/marketplace/MarketplaceNav";
import FilterBar from "@/components/marketplace/FilterBar";
import ListingCard from "@/components/marketplace/ListingCard";
import ResultsHeader from "@/components/marketplace/ResultsHeader";
import Pagination from "@/components/marketplace/Pagination";

const LIMIT = 12;

interface PublicListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-5 bg-muted rounded w-2/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 bg-muted rounded flex-1" />
          <div className="h-8 bg-muted rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Home className="w-9 h-9 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        No properties found
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Try adjusting your filters or search in a different location to find available properties.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-9 h-9 text-destructive" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        Failed to load listings
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        We couldn't fetch the property listings. Please check your connection and try again.
      </p>
    </div>
  );
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [heroSearch, setHeroSearch] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const type = searchParams.get("type") ?? "";
  const location = searchParams.get("location") ?? "";
  const propertyType = searchParams.get("propertyType") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  // Build query string for API
  const queryString = new URLSearchParams({
    ...(type ? { type } : {}),
    ...(location ? { location } : {}),
    ...(propertyType ? { propertyType } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(sort ? { sort } : {}),
    page: String(page),
    limit: String(LIMIT),
  }).toString();

  const { data, isLoading, isError } = useQuery<PublicListingsResponse>({
    queryKey: ["public-listings", queryString],
    queryFn: () => api.get<PublicListingsResponse>(`/api/listings/public?${queryString}`),
    staleTime: 60_000,
  });

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (heroSearch.trim()) {
        next.set("location", heroSearch.trim());
      } else {
        next.delete("location");
      }
      next.set("page", "1");
      return next;
    });
    // Scroll to listings
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNav />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(210 50% 16%) 40%, hsl(185 55% 22%) 100%)",
          minHeight: "420px",
        }}
      >
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Atmospheric glow */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: "hsl(185 90% 50%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{ background: "hsl(221 82% 50%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {/* Headline */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6 border border-white/10">
              <MapPin className="w-3.5 h-3.5" />
              Kenya's Premier Property Marketplace
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Find Your Perfect{" "}
              <em className="not-italic text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, hsl(185 80% 65%), hsl(38 95% 65%))",
                }}>
                Property
              </em>{" "}
              in Kenya
            </h1>

            <p className="text-white/65 text-base sm:text-lg mb-8 leading-relaxed">
              Browse thousands of verified listings across Kenya's top locations
            </p>

            {/* Hero search */}
            <form
              onSubmit={handleHeroSearch}
              className="flex gap-2 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by location, city, landmark..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="pl-10 h-12 text-sm bg-white border-0 shadow-lg rounded-xl"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 rounded-xl font-medium shadow-lg"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12">
            {[
              { icon: Building2, label: "Properties", value: "12,000+" },
              { icon: MapPin, label: "Counties", value: "47" },
              { icon: Users, label: "Agents", value: "3,500+" },
              { icon: TrendingUp, label: "Deals Closed", value: "8,200+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <span className="text-2xl sm:text-3xl font-bold text-white font-display">
                  {value}
                </span>
                <span className="text-xs text-white/50 mt-0.5 uppercase tracking-wide font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar />

      {/* Main Content */}
      <main
        ref={contentRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <ResultsHeader total={total} page={page} limit={LIMIT} />

        {/* Listings grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: LIMIT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : isError ? (
            <ErrorState />
          ) : listings.length === 0 ? (
            <EmptyState />
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 ? (
          <Pagination totalPages={totalPages} currentPage={page} />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold italic text-foreground">Hauzisha</span>
          </div>
          <p>&copy; 2025 Hauzisha. Kenya's Premier Property Platform.</p>
        </div>
      </footer>
    </div>
  );
}
