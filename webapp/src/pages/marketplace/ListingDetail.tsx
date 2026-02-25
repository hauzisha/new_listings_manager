import { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  MapPin, Bed, Bath, Maximize2, ArrowLeft, Share2,
  Phone, Mail, CheckCircle2, Home, Tag, TrendingUp,
  Users, ChevronRight, Copy, Check, Building2,
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
import { useState } from "react";

// ─── localStorage ref tracking ────────────────────────────────────────────────
const REF_KEY = "hzsh_ref";
const REF_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

function saveRef(refCode: string) {
  localStorage.setItem(
    REF_KEY,
    JSON.stringify({ code: refCode, expires: Date.now() + REF_TTL })
  );
}

function loadRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLabel(val: string) {
  return val
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
        <Home className="w-16 h-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
        <img
          src={images[active]}
          alt={`${title} — image ${active + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {active + 1} / {images.length}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === active ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
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
  const storedRef = loadRef();
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
        refCode: storedRef || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit. Please try again.");
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">Inquiry submitted!</p>
          <p className="text-muted-foreground text-sm mt-1">
            The agent will contact you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="Your full name"
          {...register("clientName", { required: "Name is required" })}
          className={errors.clientName ? "border-destructive" : ""}
        />
        {errors.clientName && (
          <p className="text-xs text-destructive mt-1">{errors.clientName.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Phone Number <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="+254 7XX XXX XXX"
          {...register("clientPhone", { required: "Phone number is required" })}
          className={errors.clientPhone ? "border-destructive" : ""}
        />
        {errors.clientPhone && (
          <p className="text-xs text-destructive mt-1">{errors.clientPhone.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
        <Input
          type="email"
          placeholder="your@email.com (optional)"
          {...register("clientEmail")}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
        <Textarea
          placeholder="Tell the agent what you're looking for, when you'd like to view, etc."
          rows={3}
          {...register("message")}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Submitting..." : "Send Inquiry"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your information is shared only with the listing agent.
      </p>
    </form>
  );
}

// ─── Share button ─────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ListingDetail() {
  const { slug, ref } = useParams<{ slug: string; ref?: string }>();
  const navigate = useNavigate();
  const refSaved = useRef(false);

  // Save the ref to localStorage when visiting a tracked URL
  useEffect(() => {
    if (ref && !refSaved.current) {
      saveRef(ref);
      refSaved.current = true;
    }
  }, [ref]);

  const storedRef = loadRef();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ["listing-detail", slug],
    queryFn: () => api.get<Listing>(`/api/listings/by-slug/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-4 animate-pulse">
              <div className="aspect-[4/3] bg-muted rounded-2xl" />
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Home className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This listing may have been removed or is no longer available.
          </p>
          <Button asChild>
            <Link to="/listings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Set document title
  document.title = `${listing.title} - ${formatLabel(listing.propertyType)} in ${listing.location} | Hauzisha`;

  const hasPromoterCommission = listing.promoterCommissionPct > 0;
  const promoterCTA = storedRef
    ? `/signup/promoter?via=${storedRef}`
    : "/signup/promoter";

  const priceLabel = listing.listingType === "RENTAL" ? "/month" : "";
  const listingTypeBadge = listing.listingType === "RENTAL" ? "For Rent" : "For Sale";

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/listings" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Listings
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium truncate max-w-xs">{listing.title}</span>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-8">
            {/* Image gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="text-xs font-semibold">
                  {listingTypeBadge}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatLabel(listing.propertyType)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatLabel(listing.nature)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-green-200 text-green-700 bg-green-50"
                >
                  {listing.status === "ACTIVE" ? "Available" : listing.status}
                </Badge>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                {listing.title}
              </h1>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{listing.location}</span>
              </div>

              {listing.nearbyLandmarks?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {listing.nearbyLandmarks.map((lm) => (
                    <span
                      key={lm}
                      className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                    >
                      {lm}
                    </span>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-primary font-display">
                  {formatKES(listing.price)}
                </span>
                {priceLabel && (
                  <span className="text-muted-foreground text-sm">{priceLabel}</span>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listing.bedrooms != null && (
                <div className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl">
                  <Bed className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{listing.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                </div>
              )}
              {listing.bathrooms != null && (
                <div className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl">
                  <Bath className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{listing.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                </div>
              )}
              {listing.areaSqft != null && (
                <div className="flex items-center gap-2.5 p-3 bg-muted/50 rounded-xl">
                  <Maximize2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {listing.areaSqft.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{listing.areaUnit}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-3">
                About This Property
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground mb-3">
                    Amenities & Features
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {listing.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Promoter commission section */}
            {hasPromoterCommission ? (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Want to earn from this property?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Promoters earn <strong>{listing.promoterCommissionPct}%</strong> commission
                      on every successful deal they bring in. Share your unique link and earn
                      when someone rents or buys through you.
                    </p>
                    <Button asChild size="sm" className="gap-2">
                      <Link to={promoterCTA}>
                        <Users className="w-4 h-4" />
                        Become a Promoter
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Promoter commission not available
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This property doesn't offer promoter commission, but many others on Hauzisha do.
                      Explore the marketplace to find properties you can earn from.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/listings">Browse Other Properties</Link>
                      </Button>
                      <Link
                        to="/signup/promoter"
                        className="text-sm text-primary hover:underline self-center"
                      >
                        Learn about promoting →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (sticky) ── */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-24">
              {/* Contact card */}
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-semibold text-foreground">
                        Interested? Reach Out
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The agent will get back to you
                      </p>
                    </div>
                    <ShareButton />
                  </div>
                </div>

                <div className="px-6 py-5">
                  <InquiryForm listing={listing} />
                </div>
              </div>

              {/* Promoter earn callout on sidebar — only show if commission available */}
              {hasPromoterCommission && (
                <div className="mt-4 border border-primary/20 bg-primary/5 rounded-2xl px-5 py-4">
                  <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Earn {listing.promoterCommissionPct}% commission
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share this property and earn when someone closes a deal.
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
                    <Link to={promoterCTA}>
                      <Users className="w-3.5 h-3.5" />
                      Start Promoting
                    </Link>
                  </Button>
                </div>
              )}

              {/* Listing meta */}
              <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
                <p>Listing #{listing.listingNumber}</p>
                <p>Listed {new Date(listing.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer area */}
      <footer className="border-t border-border mt-16 py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/listings" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-display font-bold italic text-foreground">Hauzisha</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Kenya's trusted property marketplace
          </p>
        </div>
      </footer>
    </div>
  );
}
