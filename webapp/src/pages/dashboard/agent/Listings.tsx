import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  CheckCircle,
  EyeOff,
  TrendingUp,
  MapPin,
  BedDouble,
  Bath,
  Square,
  MoreVertical,
  Share2,
  Pencil,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SharePanel } from '@/components/listings/SharePanel';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'inactive' | 'sold-rented';

function formatPrice(price: number, listingType: Listing['listingType']) {
  const formatted = price.toLocaleString('en-KE');
  return listingType === 'RENTAL' ? `KES ${formatted}/mo` : `KES ${formatted}`;
}

function StatusBadge({ status }: { status: Listing['status'] }) {
  const map = {
    ACTIVE: 'bg-emerald-500 text-white',
    INACTIVE: 'bg-gray-400 text-white',
    SOLD: 'bg-blue-500 text-white',
    RENTED: 'bg-amber-500 text-white',
  };
  const label = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SOLD: 'Sold',
    RENTED: 'Rented',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', map[status])}>
      {label[status]}
    </span>
  );
}

function ListingTypePill({ listingType }: { listingType: Listing['listingType'] }) {
  return (
    <span
      className={cn(
        'text-[10px] font-bold px-2 py-0.5 rounded-full',
        listingType === 'RENTAL'
          ? 'bg-blue-500 text-white'
          : 'bg-amber-500 text-white'
      )}
    >
      {listingType === 'RENTAL' ? 'For Rent' : 'For Sale'}
    </span>
  );
}

function CardMenu({
  listing,
  onShare,
}: {
  listing: Listing;
  onShare: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute top-full right-0 mt-1 z-50 w-44 bg-popover border border-border rounded-xl shadow-lg overflow-hidden py-1">
            <button
              type="button"
              onClick={() => { onShare(); close(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              Share Listing
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(`https://hauzisha.co.ke/listings/${listing.slug}`);
                toast.success('URL copied');
                close();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              Copy URL
            </button>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={() => { navigate(`/dashboard/agent/listings/edit/${listing.id}`); close(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              Edit Listing
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ListingCard({ listing, onClick, onShare }: { listing: Listing; onClick: () => void; onShare: () => void }) {
  const coverUrl = listing.defaultMedia || listing.images[0] || '';
  const hasImage = !!coverUrl;
  const visibleAmenities = listing.amenities.slice(0, 3);
  const extraAmenities = listing.amenities.length - 3;

  return (
    <div
      className="card-hover bg-card border border-border rounded-xl overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="img-zoom-wrap relative h-44 bg-blue-50 flex items-center justify-center">
        {hasImage ? (
          <img
            src={coverUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Building2 className="w-12 h-12 text-blue-200" />
        )}
        {/* Overlays */}
        <div className="absolute top-2 left-2">
          <ListingTypePill listingType={listing.listingType} />
        </div>
        <div className="absolute top-2 right-2">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground font-mono">
            #{String(listing.listingNumber).padStart(6, '0')}
          </p>
          <CardMenu listing={listing} onShare={onShare} />
        </div>
        <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 text-foreground">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs truncate">{listing.location}</span>
        </div>
        <p className="text-lg font-bold text-foreground">
          {formatPrice(listing.price, listing.listingType)}
        </p>

        {/* Property meta */}
        {(listing.bedrooms !== undefined || listing.bathrooms !== undefined || listing.areaSqft !== undefined) && (
          <div className="flex items-center gap-3 text-muted-foreground">
            {listing.bedrooms !== undefined && (
              <span className="flex items-center gap-1 text-xs">
                <BedDouble className="w-3.5 h-3.5" />
                {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms !== undefined && (
              <span className="flex items-center gap-1 text-xs">
                <Bath className="w-3.5 h-3.5" />
                {listing.bathrooms}
              </span>
            )}
            {listing.areaSqft !== undefined && (
              <span className="flex items-center gap-1 text-xs">
                <Square className="w-3.5 h-3.5" />
                {listing.areaSqft.toLocaleString('en-KE')} {listing.areaUnit}
              </span>
            )}
          </div>
        )}

        {/* Amenities */}
        {listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleAmenities.map((a) => (
              <span key={a} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {a}
              </span>
            ))}
            {extraAmenities > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                +{extraAmenities} more
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  topBorderClass,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  topBorderClass: string;
}) {
  return (
    <div className={cn('card-hover bg-card border border-border border-t-2 rounded-xl p-4 flex items-center gap-3', topBorderClass)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner', iconClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="px-4 py-2.5 border-t border-border">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Sold/Rented', value: 'sold-rented' },
];

export default function AgentListings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [shareListing, setShareListing] = useState<Listing | null>(null);
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['agent-listings'],
    queryFn: () => api.get<Listing[]>('/api/listings/agent'),
  });

  const filtered = listings.filter((l) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return l.status === 'ACTIVE';
    if (activeTab === 'inactive') return l.status === 'INACTIVE';
    if (activeTab === 'sold-rented') return l.status === 'SOLD' || l.status === 'RENTED';
    return true;
  });

  const totalActive = listings.filter((l) => l.status === 'ACTIVE').length;
  const totalInactive = listings.filter((l) => l.status === 'INACTIVE').length;
  const totalSoldRented = listings.filter((l) => l.status === 'SOLD' || l.status === 'RENTED').length;

  return (
    <DashboardLayout title="My Listings">
      <div className="p-5 md:p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">My Listings</h2>
            {!isLoading && (
              <Badge variant="secondary" className="text-xs">
                {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
              </Badge>
            )}
          </div>
          <Button
            className="h-9 px-4 text-sm font-semibold"
            onClick={() => navigate('/dashboard/agent/listings/new')}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Listing
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Listings"
            value={listings.length}
            icon={Building2}
            iconClass="bg-primary/10 text-primary"
            topBorderClass="border-t-primary"
          />
          <StatCard
            label="Active"
            value={totalActive}
            icon={CheckCircle}
            iconClass="bg-emerald-100 text-emerald-600"
            topBorderClass="border-t-emerald-500"
          />
          <StatCard
            label="Inactive"
            value={totalInactive}
            icon={EyeOff}
            iconClass="bg-gray-100 text-gray-500"
            topBorderClass="border-t-gray-400"
          />
          <StatCard
            label="Sold / Rented"
            value={totalSoldRented}
            icon={TrendingUp}
            iconClass="bg-amber-100 text-amber-600"
            topBorderClass="border-t-amber-500"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              {activeTab === 'all' ? 'No listings yet' : `No ${activeTab} listings`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {activeTab === 'all'
                ? 'Create your first listing to start managing properties.'
                : 'No listings match this filter.'}
            </p>
            {activeTab === 'all' && (
              <Button onClick={() => navigate('/dashboard/agent/listings/new')}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create your first listing
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/dashboard/agent/listings/${listing.id}`)}
                onShare={() => setShareListing(listing)}
              />
            ))}
          </div>
        )}
      </div>

      {shareListing && (
        <SharePanel
          open={!!shareListing}
          onClose={() => setShareListing(null)}
          listingId={shareListing.id}
          listingTitle={shareListing.title}
        />
      )}
    </DashboardLayout>
  );
}
