import { useNavigate } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize2, Home, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
}

function ImagePlaceholder({ propertyType }: { propertyType: string }) {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
        <Home className="w-6 h-6 text-white/70" />
      </div>
      <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
        {propertyType}
      </span>
    </div>
  );
}

export default function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();

  const isRental = listing.listingType === "RENTAL";
  const promoterEarnings = listing.promoterCommissionPct > 0
    ? Math.round(listing.price * listing.promoterCommissionPct / 100)
    : 0;

  return (
    <article className="bg-white rounded-xl border border-border overflow-hidden card-hover flex flex-col">
      {/* Image */}
      <div className="relative">
        <div className="img-zoom-wrap relative">
          {listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="object-cover w-full h-48"
              loading="lazy"
            />
          ) : (
            <ImagePlaceholder propertyType={listing.propertyType} />
          )}
        </div>

        {/* Listing type badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
              isRental
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-green-100 text-green-800 border border-green-200"
            )}
          >
            {isRental ? "For Rent" : "For Sale"}
          </span>
        </div>

        {/* Property type badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/40 text-white backdrop-blur-sm">
            {listing.propertyType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <h3 className="font-display font-semibold text-base text-foreground truncate mb-1">
          {listing.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          {listing.bedrooms != null ? (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{listing.bedrooms} bd</span>
            </span>
          ) : null}
          {listing.bathrooms != null ? (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{listing.bathrooms} ba</span>
            </span>
          ) : null}
          {listing.areaSqft != null ? (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{listing.areaSqft.toLocaleString()} {listing.areaUnit}</span>
            </span>
          ) : null}
        </div>

        {/* Price */}
        <div className="mb-3">
          <span className="text-xl font-bold text-foreground">
            KES {listing.price.toLocaleString()}
          </span>
          {isRental ? (
            <span className="text-sm text-muted-foreground font-normal">/mo</span>
          ) : null}
        </div>

        {/* Commission section */}
        <div className="mb-4">
          {listing.promoterCommissionPct > 0 ? (
            <span className="gold-pill">
              <TrendingUp className="w-3 h-3" />
              Earn {listing.promoterCommissionPct}% &middot; KES {promoterEarnings.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No promoter commission</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs font-medium"
            onClick={() => navigate(`/listings/${listing.slug}`)}
          >
            I'm Interested
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white border-0"
            onClick={() => navigate(`/listings/${listing.slug}/promote`)}
          >
            Promote
          </Button>
        </div>
      </div>
    </article>
  );
}
