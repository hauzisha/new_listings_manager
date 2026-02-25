import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Building2, MapPin, User, ChevronDown, X,
  ExternalLink, Tag, Calendar, Hash, DollarSign,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminListing extends Listing {
  agentName: string;
  agentId: string;
}

interface AgentOption {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  return `${m}mo ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:   { label: "Active",   color: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800" },
  INACTIVE: { label: "Inactive", color: "bg-muted text-muted-foreground border-border" },
  SOLD:     { label: "Sold",     color: "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800" },
  RENTED:   { label: "Rented",   color: "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
      type === "RENTAL"
        ? "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-400 dark:border-sky-800"
        : "bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800"
    )}>
      {type === "RENTAL" ? "For Rent" : "For Sale"}
    </span>
  );
}

// ─── Status change dropdown ────────────────────────────────────────────────────

function StatusChanger({ listing, onChanged }: { listing: AdminListing; onChanged: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/listings/${listing.id}/status`, { status }),
    onSuccess: (_, status) => {
      toast.success(`Status changed to ${titleCase(status)}`);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      onChanged();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update status"),
  });

  const options = ["ACTIVE", "INACTIVE", "SOLD", "RENTED"].filter((s) => s !== listing.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" disabled={mutation.isPending}>
          {mutation.isPending ? "Updating..." : "Change Status"}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map((s) => (
          <DropdownMenuItem key={s} onClick={() => mutation.mutate(s)} className="text-xs cursor-pointer">
            <StatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Detail dialog ─────────────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
      <div className="text-sm font-semibold text-foreground leading-snug">{value}</div>
    </div>
  );
}

function ListingDetailDialog({
  listing,
  onClose,
}: {
  listing: AdminListing;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden">

        {/* Hero image — flush to all edges, no padding, close button floats above */}
        <div className="relative w-full h-48 sm:h-60 bg-muted flex-shrink-0">
          {listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Building2 className="w-14 h-14 text-muted-foreground/15" />
            </div>
          )}
          {listing.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              1 / {listing.images.length} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* Title + badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={listing.status} />
              <TypeBadge type={listing.listingType} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground bg-muted/40">
                {titleCase(listing.propertyType)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground bg-muted/40">
                {titleCase(listing.nature)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{listing.title}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
              {listing.location}
            </p>
            {(listing.nearbyLandmarks?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {listing.nearbyLandmarks.map((lm) => (
                  <span key={lm} className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Near {lm}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Key facts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <InfoCell
              label="Price"
              value={
                <span>
                  {formatKES(listing.price)}
                  {listing.listingType === "RENTAL" && (
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">/mo</span>
                  )}
                </span>
              }
            />
            <InfoCell label="Agent" value={listing.agentName} />
            <InfoCell label="Listing #" value={`#${listing.listingNumber}`} />
            {listing.bedrooms != null && (
              <InfoCell label="Bedrooms" value={listing.bedrooms} />
            )}
            {listing.bathrooms != null && (
              <InfoCell label="Bathrooms" value={listing.bathrooms} />
            )}
            {listing.areaSqft != null && (
              <InfoCell label="Area" value={`${listing.areaSqft.toLocaleString()} ${listing.areaUnit}`} />
            )}
            <InfoCell
              label="Listed"
              value={new Date(listing.createdAt).toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            />
            <InfoCell
              label="Updated"
              value={new Date(listing.updatedAt).toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            />
          </div>

          {/* Commission breakdown */}
          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2.5">Commission Split</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Agent", value: listing.agentCommissionPct },
                { label: "Promoter", value: listing.promoterCommissionPct },
                { label: "Company", value: listing.companyCommissionPct },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-foreground leading-none">{value}%</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {listing.amenities.map((a) => (
                  <span key={a} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <StatusChanger listing={listing} onChanged={onClose} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                <Link to={`/listings/${listing.slug}`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Public Page
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  onClick,
}: {
  listing: AdminListing;
  onClick: () => void;
}) {
  return (
    <tr
      className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Preview image — 56×56 so it's actually visible */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-border bg-muted">
            {listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/60">
                <Building2 className="w-5 h-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors leading-snug">
              {listing.title}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
              {listing.slug}
            </p>
            {/* Show type badge inline on medium screens where the Type col is hidden */}
            <div className="flex gap-1.5 mt-1 lg:hidden">
              <TypeBadge type={listing.listingType} />
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground hidden md:table-cell">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
          {listing.location}
        </span>
      </td>
      <td className="px-4 py-2.5 hidden lg:table-cell">
        <TypeBadge type={listing.listingType} />
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <p className="text-sm font-bold text-foreground">
          {formatKES(listing.price)}
        </p>
        {listing.listingType === "RENTAL" && (
          <p className="text-[10px] text-muted-foreground">/month</p>
        )}
      </td>
      <td className="px-4 py-2.5 hidden lg:table-cell">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="truncate max-w-[120px]">{listing.agentName}</span>
        </span>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={listing.status} />
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden xl:table-cell whitespace-nowrap">
        #{listing.listingNumber}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden xl:table-cell whitespace-nowrap">
        {timeAgo(listing.createdAt)}
      </td>
    </tr>
  );
}

// ─── Mobile card ───────────────────────────────────────────────────────────────

function ListingCard({ listing, onClick }: { listing: AdminListing; onClick: () => void }) {
  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all group"
      onClick={onClick}
    >
      {/* Image strip at top for mobile */}
      <div className="relative w-full h-36 bg-muted overflow-hidden">
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Building2 className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        {/* Status badge overlaid on image */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={listing.status} />
        </div>
        <div className="absolute top-2.5 right-2.5">
          <TypeBadge type={listing.listingType} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{listing.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />{listing.location}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-primary">{formatKES(listing.price)}</p>
            {listing.listingType === "RENTAL" && <p className="text-[10px] text-muted-foreground">/month</p>}
            <p className="text-[10px] text-muted-foreground mt-1">#{listing.listingNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground truncate">{listing.agentName}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["", "ACTIVE", "INACTIVE", "SOLD", "RENTED"] as const;
const TYPE_OPTIONS = ["", "RENTAL", "SALE"] as const;

export default function AdminListings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selected, setSelected] = useState<AdminListing | null>(null);

  // Build query string
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  if (typeFilter) params.set("listingType", typeFilter);
  if (agentFilter) params.set("agentId", agentFilter);
  if (locationFilter) params.set("location", locationFilter);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings", search, statusFilter, typeFilter, agentFilter, locationFilter],
    queryFn: () => api.get<AdminListing[]>(`/api/listings/admin?${params.toString()}`),
  });

  // Derive agent options from loaded data (avoid extra API call)
  const agentOptions: AgentOption[] = Array.from(
    new Map(listings.map((l) => [l.agentId, { id: l.agentId, name: l.agentName }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const hasFilters = !!(search || statusFilter || typeFilter || agentFilter || locationFilter);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setAgentFilter("");
    setLocationFilter("");
  }

  // Status counts (from full unfiltered data, but we only have filtered — use what we have)
  const statusCounts = {
    ACTIVE: listings.filter((l) => l.status === "ACTIVE").length,
    INACTIVE: listings.filter((l) => l.status === "INACTIVE").length,
    SOLD: listings.filter((l) => l.status === "SOLD").length,
    RENTED: listings.filter((l) => l.status === "RENTED").length,
  };

  return (
    <DashboardLayout title="Listings">
      <div className="p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">All Listings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading..." : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
              {hasFilters && " matching filters"}
            </p>
          </div>
        </div>

        {/* Status summary pills */}
        {!isLoading && !hasFilters && (
          <div className="flex flex-wrap gap-2">
            {(["ACTIVE", "INACTIVE", "SOLD", "RENTED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <StatusBadge status={s} />
                <span>{statusCounts[s]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {/* Status */}
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="RENTAL">For Rent</SelectItem>
                <SelectItem value="SALE">For Sale</SelectItem>
              </SelectContent>
            </Select>

            {/* Agent */}
            {agentOptions.length > 0 && (
              <Select value={agentFilter || "all"} onValueChange={(v) => setAgentFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agentOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Location…"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-7 h-8 text-xs w-[140px]"
              />
            </div>

            {/* Clear */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground mb-1">No listings found</p>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? "Try adjusting your filters." : "No listings have been created yet."}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 text-xs">
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && listings.length > 0 && (
          <>
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Listing</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Price</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Agent</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">
                        <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />#</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Date</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <ListingRow
                        key={listing.id}
                        listing={listing}
                        onClick={() => setSelected(listing)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => setSelected(listing)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail dialog */}
      {selected && (
        <ListingDetailDialog
          listing={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </DashboardLayout>
  );
}
