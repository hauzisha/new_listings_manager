import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Share2,
  MapPin,
  BedDouble,
  Bath,
  Square,
  CheckCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Film,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SharePanel } from '@/components/listings/SharePanel';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const DESCRIPTION_TRUNCATE = 280;

function formatPrice(price: number, listingType: Listing['listingType']) {
  const formatted = price.toLocaleString('en-KE');
  return listingType === 'RENTAL' ? `KES ${formatted}/mo` : `KES ${formatted}`;
}

function toTitleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Listing['status'] }) {
  const map: Record<Listing['status'], string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
    SOLD: 'bg-blue-100 text-blue-700 border-blue-200',
    RENTED: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const label: Record<Listing['status'], string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SOLD: 'Sold',
    RENTED: 'Rented',
  };
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', map[status])}>
      {label[status]}
    </span>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

function Gallery({ items }: { items: GalleryItem[] }) {
  const [current, setCurrent] = useState(0);

  if (items.length === 0) {
    return (
      <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No photos added yet</p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
        {item.type === 'image' ? (
          <img src={item.url} alt={`Media ${current + 1}`} className="w-full h-full object-cover" />
        ) : (
          <video src={item.url} controls className="w-full h-full object-contain" />
        )}
        {items.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c === 0 ? items.length - 1 : c - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c === items.length - 1 ? 0 : c + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {current + 1} / {items.length}
        </div>
        {item.type === 'video' && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> Video
          </div>
        )}
      </div>
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                i === current ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
              )}
            >
              {it.type === 'image' ? (
                <img src={it.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Film className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Description with truncation ─────────────────────────────────────────────

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = text.length > DESCRIPTION_TRUNCATE;
  const displayed = needsTruncate && !expanded ? text.slice(0, DESCRIPTION_TRUNCATE).trimEnd() : text;

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {displayed}
        {needsTruncate && !expanded && '…'}
      </p>
      {needsTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> See more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Commission Card ─────────────────────────────────────────────────────────

function CommissionCard({ listing }: { listing: Listing }) {
  const { price, agentCommissionPct, promoterCommissionPct, companyCommissionPct } = listing;
  const totalPct = agentCommissionPct + promoterCommissionPct + companyCommissionPct;
  const fmt = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`;

  if (totalPct === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h2 className="font-display font-semibold text-sm text-foreground">Commission</h2>
      </div>
      <div className="p-4 space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <span className="text-muted-foreground font-sans text-xs">
            Total — {listing.listingType === 'RENTAL' ? 'per month' : 'on sale'}
          </span>
          <span className="font-semibold text-foreground">
            {fmt((price * totalPct) / 100)} ({totalPct}%)
          </span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-muted-foreground">└─ Agent</span>
          <span className="font-semibold text-emerald-700">
            {fmt((price * agentCommissionPct) / 100)} ({agentCommissionPct}%)
          </span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-muted-foreground">└─ Company</span>
          <span className="font-semibold text-blue-700">
            {fmt((price * companyCommissionPct) / 100)} ({companyCommissionPct}%)
          </span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-muted-foreground">└─ Promoter</span>
          <span className="font-semibold text-amber-700">
            {fmt((price * promoterCommissionPct) / 100)} ({promoterCommissionPct}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-5">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="aspect-video rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ViewListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<Listing>(`/api/listings/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <DashboardLayout title="Listing"><LoadingSkeleton /></DashboardLayout>;
  }

  if (isError || !listing) {
    return (
      <DashboardLayout title="Listing">
        <div className="p-6 text-center space-y-3 py-20">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-foreground font-semibold">Listing not found</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/agent/listings')}>
            Back to listings
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const galleryItems: GalleryItem[] = [
    ...listing.images.map((url) => ({ url, type: 'image' as const })),
    ...listing.videos.map((url) => ({ url, type: 'video' as const })),
  ];

  const createdDate = new Date(listing.createdAt).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardLayout title={listing.title}>
      <div className="p-5 md:p-6 max-w-4xl mx-auto space-y-6">

        {/* Top nav */}
        <button
          onClick={() => navigate('/dashboard/agent/listings')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Listings
        </button>

        {/* Gallery */}
        <Gallery items={galleryItems} />

        {/* Header block */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground">
                #{String(listing.listingNumber).padStart(6, '0')}
              </p>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{listing.location}</span>
                {listing.nearbyLandmarks.length > 0 && (
                  <span className="text-muted-foreground/60 text-sm">
                    · near {listing.nearbyLandmarks.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(listing.price, listing.listingType)}
              </p>
              <StatusBadge status={listing.status} />
            </div>
          </div>

          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                listing.listingType === 'RENTAL'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-amber-100 text-amber-700'
              )}
            >
              {listing.listingType === 'RENTAL' ? 'For Rent' : 'For Sale'}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              {toTitleCase(listing.propertyType)}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              {listing.nature === 'MIXED' ? 'Mixed Use' : toTitleCase(listing.nature)}
            </span>
          </div>

          {/* Quick stats */}
          {(listing.bedrooms || listing.bathrooms || listing.areaSqft) && (
            <div className="flex flex-wrap gap-4 py-3 px-4 bg-muted/50 rounded-xl border border-border">
              {listing.bedrooms != null && listing.bedrooms > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{listing.bedrooms}</span>
                  <span className="text-muted-foreground">
                    {listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                  </span>
                </div>
              )}
              {listing.bathrooms != null && listing.bathrooms > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{listing.bathrooms}</span>
                  <span className="text-muted-foreground">
                    {listing.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                  </span>
                </div>
              )}
              {listing.areaSqft != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Square className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {listing.areaSqft.toLocaleString('en-KE')}
                  </span>
                  <span className="text-muted-foreground">{listing.areaUnit}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="space-y-2">
              <h2 className="font-display font-semibold text-base text-foreground">Description</h2>
              <Description text={listing.description} />
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display font-semibold text-base text-foreground">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <span
                      key={a}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/20"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Landmarks */}
            {listing.nearbyLandmarks.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display font-semibold text-base text-foreground">Nearby</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.nearbyLandmarks.map((lm) => (
                    <span
                      key={lm}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border"
                    >
                      <MapPin className="w-3 h-3" />
                      {lm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Listing Details */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h2 className="font-display font-semibold text-sm text-foreground">Listing Details</h2>
              </div>
              <div className="px-4">
                <InfoRow label="Status" value={<StatusBadge status={listing.status} />} />
                <InfoRow label="Type" value={listing.listingType === 'RENTAL' ? 'For Rent' : 'For Sale'} />
                <InfoRow label="Property" value={toTitleCase(listing.propertyType)} />
                <InfoRow label="Nature" value={listing.nature === 'MIXED' ? 'Mixed Use' : toTitleCase(listing.nature)} />
                <InfoRow label="Location" value={listing.location} />
                <InfoRow label="Created" value={createdDate} />
                <InfoRow
                  label="Listing #"
                  value={<span className="font-mono">#{String(listing.listingNumber).padStart(6, '0')}</span>}
                />
              </div>
            </div>

            {/* URL */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Listing URL</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-primary truncate flex-1">
                  hauzisha.co.ke/listings/{listing.slug}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`https://hauzisha.co.ke/listings/${listing.slug}`);
                    toast.success('URL copied');
                  }}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Commission */}
            <CommissionCard listing={listing} />

            {/* Actions — below commission */}
            <div className="space-y-2 pt-1">
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="w-4 h-4" />
                Share Listing
              </Button>
              <Button
                className="w-full gap-2"
                onClick={() => navigate(`/dashboard/agent/listings/edit/${listing.id}`)}
              >
                <Pencil className="w-4 h-4" />
                Edit Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Share panel (bottom sheet) */}
      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
      />
    </DashboardLayout>
  );
}
