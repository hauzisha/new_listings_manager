import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  MapPin, Bed, Bath, Maximize2, ArrowLeft, Share2,
  CheckCircle2, Home, Tag, TrendingUp, Users,
  X, ChevronLeft, ChevronRight, Check, Building2,
  Phone, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";
import MarketplaceNav from "@/components/marketplace/MarketplaceNav";
import { toast } from "sonner";

// ─── localStorage ref tracking ────────────────────────────────────────────────
const REF_KEY = "hzsh_ref";
const REF_TTL = 30 * 24 * 60 * 60 * 1000;

function saveRef(code: string) {
  localStorage.setItem(REF_KEY, JSON.stringify({ code, expires: Date.now() + REF_TTL }));
}

function loadRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem(REF_KEY); return null; }
    return code;
  } catch { return null; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
}
function titleCase(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function timeAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X className="w-7 h-7" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {current + 1} / {images.length}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      <img
        src={images[current]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images.length) {
    return (
      <div className="w-full h-64 sm:h-80 lg:h-[420px] bg-muted rounded-2xl flex items-center justify-center">
        <Home className="w-16 h-16 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <>
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}
      <div className="space-y-2">
        {/* Main image */}
        <div
          className="relative w-full h-64 sm:h-80 lg:h-[420px] rounded-2xl overflow-hidden bg-muted cursor-zoom-in group"
          onClick={() => setLightbox(active)}
        >
          <img
            src={images[active]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {images.length > 1 && (
            <>
              {/* prev/next on main */}
              <button
                onClick={(e) => { e.stopPropagation(); setActive(i => (i - 1 + images.length) % images.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActive(i => (i + 1) % images.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {active + 1} / {images.length}
              </div>
            </>
          )}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            Tap to enlarge
          </div>
        </div>
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {images.map((src, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === active ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Spec Pill ─────────────────────────────────────────────────────────────────
function SpecPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Inquiry Form ─────────────────────────────────────────────────────────────
interface InquiryFormValues {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
}

function InquiryForm({ listing }: { listing: Listing }) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<InquiryFormValues>();

  const mutation = useMutation({
    mutationFn: (data: InquiryFormValues) =>
      api.post("/api/inquiries/public", {
        listingId: listing.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail || undefined,
        clientPhone: data.clientPhone,
        message: data.message || undefined,
        refCode: loadRef() || undefined,
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast.error(err.message || "Failed to submit. Please try again."),
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Inquiry submitted!</p>
          <p className="text-muted-foreground text-sm mt-1">The agent will contact you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-3.5">
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5 block">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input placeholder="Your full name" {...register("clientName", { required: "Required" })}
          className={`h-10 text-sm ${errors.clientName ? "border-destructive" : ""}`} />
        {errors.clientName && <p className="text-xs text-destructive mt-1">{errors.clientName.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5 block">
          Phone Number <span className="text-destructive">*</span>
        </label>
        <Input placeholder="+254 7XX XXX XXX" {...register("clientPhone", { required: "Required" })}
          className={`h-10 text-sm ${errors.clientPhone ? "border-destructive" : ""}`} />
        {errors.clientPhone && <p className="text-xs text-destructive mt-1">{errors.clientPhone.message}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5 block">
          Email <span className="text-muted-foreground font-normal normal-case">(optional)</span>
        </label>
        <Input type="email" placeholder="your@email.com" {...register("clientEmail")} className="h-10 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5 block">Message</label>
        <Textarea placeholder="When would you like to view? Any specific requirements?" rows={3}
          {...register("message")} className="text-sm resize-none" />
      </div>
      <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Send Inquiry"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Your details are only shared with the listing agent.
      </p>
    </form>
  );
}

// ─── Mobile Inquiry Drawer ─────────────────────────────────────────────────────
function MobileInquiryBar({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Fixed bar at bottom on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground leading-none">Price</p>
          <p className="font-bold text-primary text-base leading-tight">
            {formatKES(listing.price)}
            {listing.listingType === "RENTAL" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
          </p>
        </div>
        <Button className="flex-1 h-11 font-semibold" onClick={() => setOpen(true)}>
          <Phone className="w-4 h-4 mr-1.5" />
          I'm Interested
        </Button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-background rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h3 className="font-semibold text-foreground">Interested? Reach Out</h3>
                <p className="text-xs text-muted-foreground">The agent will get back to you</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5 pb-10">
              <InquiryForm listing={listing} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied");
      });
    }}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ListingDetail() {
  const { slug, ref } = useParams<{ slug: string; ref?: string }>();
  const refSaved = useRef(false);

  useEffect(() => {
    if (ref && !refSaved.current) {
      refSaved.current = true;
      // Persist ref locally for 30 days
      saveRef(ref);
      // Record click server-side (fire-and-forget, no auth needed)
      api.post(`/api/tracking-links/${ref}/click`).catch(() => {/* silent */});
    }
  }, [ref]);

  const storedRef = loadRef();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ["listing-detail", slug],
    queryFn: () => api.get<Listing>(`/api/listings/by-slug/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} - ${titleCase(listing.propertyType)} in ${listing.location} | Hauzisha`;
    }
  }, [listing]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceNav />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-64 sm:h-80 lg:h-[420px] bg-muted rounded-2xl" />
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="h-96 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceNav />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <Home className="w-9 h-9 text-muted-foreground/40" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Property Not Found</h1>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            This listing may have been removed or is no longer available.
          </p>
          <Button asChild><Link to="/listings"><ArrowLeft className="w-4 h-4 mr-2" />Back to Listings</Link></Button>
        </div>
      </div>
    );
  }

  const hasPromoterCommission = listing.promoterCommissionPct > 0;
  const promoterCTA = storedRef ? `/signup/promoter?via=${storedRef}` : "/signup/promoter";
  const isRental = listing.listingType === "RENTAL";

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <MarketplaceNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/listings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </Link>
          <ShareButton />
        </div>

        {/* Hero image — full width */}
        <div className="mb-6">
          <ImageGallery images={listing.images} title={listing.title} />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-7 min-w-0">

            {/* Badges + title + location + price */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge className="text-xs font-semibold">{isRental ? "For Rent" : "For Sale"}</Badge>
                <Badge variant="outline" className="text-xs">{titleCase(listing.propertyType)}</Badge>
                <Badge variant="outline" className="text-xs">{titleCase(listing.nature)}</Badge>
                <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  {listing.status === "ACTIVE" ? "Available" : titleCase(listing.status)}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {listing.title}
              </h1>

              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{listing.location}</span>
              </div>

              {(listing.nearbyLandmarks?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {listing.nearbyLandmarks.map(lm => (
                    <span key={lm} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                      Near {lm}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-bold text-primary">{formatKES(listing.price)}</span>
                {isRental && <span className="text-muted-foreground text-sm font-normal">/month</span>}
              </div>
            </div>

            {/* Specs row */}
            {(listing.bedrooms != null || listing.bathrooms != null || listing.areaSqft != null) && (
              <div className="flex flex-wrap gap-2">
                {listing.bedrooms != null && (
                  <SpecPill icon={<Bed className="w-4 h-4" />} value={listing.bedrooms} label="Bedrooms" />
                )}
                {listing.bathrooms != null && (
                  <SpecPill icon={<Bath className="w-4 h-4" />} value={listing.bathrooms} label="Bathrooms" />
                )}
                {listing.areaSqft != null && (
                  <SpecPill
                    icon={<Maximize2 className="w-4 h-4" />}
                    value={`${listing.areaSqft.toLocaleString()} ${listing.areaUnit}`}
                    label="Floor Area"
                  />
                )}
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">About This Property</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {(listing.amenities?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-3">Amenities & Features</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                    {listing.amenities.map(a => (
                      <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Promoter section — bottom of left col */}
            {hasPromoterCommission ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">Want to earn from this property?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Promoters earn <strong className="text-foreground">{listing.promoterCommissionPct}%</strong> commission per successful deal.
                      Share your unique link and earn when someone rents or buys through you.
                    </p>
                    <Button asChild size="sm" className="gap-1.5 text-xs">
                      <Link to={promoterCTA}><Users className="w-3.5 h-3.5" />Become a Promoter</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/40 p-5">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">Promoter commission not available</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      This property doesn't offer promoter commission, but many others on Hauzisha do.
                    </p>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to="/listings">Browse Listings</Link>
                      </Button>
                      <Link to="/signup/promoter" className="text-xs text-primary hover:underline">
                        Learn about promoting →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listing meta */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-1 pb-2">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Listing #{listing.listingNumber}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Listed {timeAgo(listing.createdAt)}</span>
            </div>
          </div>

          {/* ── RIGHT (sticky sidebar, desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">

              {/* Price summary */}
              <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-4">
                <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide mb-1">
                  {isRental ? "Monthly Rent" : "Asking Price"}
                </p>
                <p className="text-2xl font-bold leading-none">
                  {formatKES(listing.price)}
                  {isRental && <span className="text-sm font-normal text-primary-foreground/70 ml-1">/mo</span>}
                </p>
              </div>

              {/* Inquiry card */}
              <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="font-semibold text-foreground text-sm">Interested? Reach Out</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">The agent will get back to you</p>
                </div>
                <div className="px-5 py-5">
                  <InquiryForm listing={listing} />
                </div>
              </div>

              {/* Promoter sidebar callout */}
              {hasPromoterCommission && (
                <div className="border border-primary/20 bg-primary/5 rounded-2xl px-4 py-4">
                  <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Earn {listing.promoterCommissionPct}% commission
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share this listing and earn when a deal closes through your link.
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full text-xs gap-1.5">
                    <Link to={promoterCTA}><Users className="w-3.5 h-3.5" />Start Promoting</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile floating bar */}
      <MobileInquiryBar listing={listing} />
    </div>
  );
}
