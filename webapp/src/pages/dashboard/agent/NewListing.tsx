import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  Home,
  Layers,
  House,
  Copy,
  Star,
  Hotel,
  Briefcase,
  Map,
  MapPin,
  BedDouble,
  Bath,
  Square,
  Sparkles,
  X,
  CheckCircle,
  ClipboardCopy,
  Castle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberStepper } from '@/components/listings/NumberStepper';
import { MediaUpload } from '@/components/listings/MediaUpload';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatKES(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num) || value === '' || value === 0) return '';
  return num.toLocaleString('en-KE');
}

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  listingType: z.enum(['RENTAL', 'SALE']),
  nature: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED']),
  propertyType: z.string().min(1, 'Select a property type'),
  location: z.string().min(1, 'Location is required'),
  nearbyLandmarks: z.array(z.string()),
  price: z.number().min(1, 'Price must be greater than 0'),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  areaSqft: z.number().optional(),
  areaUnit: z.enum(['sqft', 'sqm']),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  amenities: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  agentCommissionPct: z.number().min(0).max(100),
  promoterCommissionPct: z.number().min(0).max(100),
  companyCommissionPct: z.number().min(0).max(100),
});

type ListingFormValues = z.infer<typeof listingSchema>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: 'Apartment', value: 'APARTMENT', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Maisonette', value: 'MAISONETTE', icon: <Home className="w-5 h-5" /> },
  { label: 'Villa', value: 'VILLA', icon: <Castle className="w-5 h-5" /> },
  { label: 'Studio', value: 'STUDIO', icon: <Layers className="w-5 h-5" /> },
  { label: 'Bungalow', value: 'BUNGALOW', icon: <House className="w-5 h-5" /> },
  { label: 'Duplex', value: 'DUPLEX', icon: <Copy className="w-5 h-5" /> },
  { label: 'Penthouse', value: 'PENTHOUSE', icon: <Star className="w-5 h-5" /> },
  { label: 'Townhouse', value: 'TOWNHOUSE', icon: <Hotel className="w-5 h-5" /> },
];

const AMENITIES = [
  'Swimming Pool', 'Gym/Fitness Centre', '24hr Security', 'CCTV Surveillance',
  'Backup Generator', 'Borehole Water', 'Solar Panels', 'Covered Parking',
  'Visitor Parking', 'Lift/Elevator', 'Balcony', 'Garden/Compound',
  'DSQ (Servant Quarter)', 'Staff Quarters', 'Wheelchair Access',
  'Fibre Internet', 'Air Conditioning', 'Furnished', 'Pet Friendly',
  'Gated Community', 'Intercom', 'Water Storage Tank',
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (tag && !values.includes(tag)) {
        onChange([...values, tag]);
      }
      setInput('');
    },
    [values, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(values.filter((v) => v !== tag));

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-md min-h-[42px] bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
      {values.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/70">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={values.length === 0 ? placeholder : ''}
      />
    </div>
  );
}

interface SlugPreviewData {
  slug: string;
  listingNumber: number;
}

function SlugPreviewCard({
  propertyType,
  listingType,
  location,
}: {
  propertyType: string;
  listingType: string;
  location: string;
}) {
  const enabled = !!(propertyType && listingType && location);

  const { data, isLoading } = useQuery({
    queryKey: ['slug-preview', propertyType, listingType, location],
    queryFn: () =>
      api.get<SlugPreviewData>(
        `/api/listings/slug-preview?propertyType=${encodeURIComponent(propertyType)}&listingType=${encodeURIComponent(listingType)}&location=${encodeURIComponent(location)}`
      ),
    enabled,
    staleTime: 30_000,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data?.slug) {
      navigator.clipboard.writeText(`hauzisha.co.ke/listings/${data.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">URL Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!enabled ? (
          <p className="text-xs text-muted-foreground">
            Fill in property type, listing type and location to preview the URL.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        ) : data ? (
          <>
            <p className="text-xs text-muted-foreground">
              Listing Number:{' '}
              <span className="font-mono font-semibold text-foreground">
                #{String(data.listingNumber).padStart(6, '0')}
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-mono text-primary truncate flex-1">
                hauzisha.co.ke/listings/{data.slug}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ClipboardCopy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Could not generate preview.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CommissionPreview({
  price,
  totalPct,
  agentPct,
  promoterPct,
  companyPct,
}: {
  price: number;
  totalPct: number;
  agentPct: number;
  promoterPct: number;
  companyPct: number;
}) {
  const fmt = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`;

  if (!price || price <= 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        Enter a price to see the commission breakdown
      </p>
    );
  }

  const totalAmt = (price * totalPct) / 100;
  const agentAmt = (price * agentPct) / 100;
  const promoterAmt = (price * promoterPct) / 100;
  const companyAmt = (price * companyPct) / 100;

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs font-mono">
      <p className="text-muted-foreground font-sans font-medium mb-2">
        Commission breakdown on a{' '}
        <span className="font-semibold text-foreground">KES {formatKES(price)}</span> listing:
      </p>
      <div className="border-b border-border pb-1.5 mb-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Landlord/Developer pays</span>
          <span className="font-semibold text-foreground">
            {fmt(totalAmt)} ({totalPct}%)
          </span>
        </div>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Agent receives</span>
        <span className="font-semibold text-emerald-700">
          {fmt(agentAmt)} ({agentPct}%)
        </span>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Company receives</span>
        <span className="font-semibold text-blue-700">
          {fmt(companyAmt)} ({companyPct}%)
        </span>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Promoter receives</span>
        <span className="font-semibold text-amber-700">
          {fmt(promoterAmt)} ({promoterPct}%)
        </span>
      </div>
      <div className="border-t border-border pt-1.5 mt-1 flex justify-between font-sans">
        <span className="text-xs text-muted-foreground font-medium">
          {Math.abs((agentAmt + companyAmt + promoterAmt) - totalAmt) < 1
            ? '✓ Shares balance correctly'
            : `⚠ Gap: ${fmt(totalAmt - agentAmt - companyAmt - promoterAmt)}`}
        </span>
      </div>
    </div>
  );
}

// ─── Success Dialog ─────────────────────────────────────────────────────────────

function SuccessDialog({
  open,
  listing,
  onViewAll,
  onCreateAnother,
}: {
  open: boolean;
  listing: Listing | null;
  onViewAll: () => void;
  onCreateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = listing ? `hauzisha.co.ke/listings/${listing.slug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!listing) return null;

  const isRental = listing.listingType === 'RENTAL';
  const priceLabel = isRental
    ? `KES ${listing.price.toLocaleString('en-KE')}/mo`
    : `KES ${listing.price.toLocaleString('en-KE')}`;

  const propertyLabel = listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase();

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Royal blue header band */}
        <div className="bg-primary px-6 pt-8 pb-6 text-center relative">
          {/* Animated success ring */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s', animationIterationCount: 1 }} />
            <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Listing Created!</h2>
          <p className="text-primary-foreground/70 text-sm mt-1">Your property is now live on Hauzisha</p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Key listing details */}
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground font-display leading-snug">
              {listing.title}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${isRental ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {isRental ? 'For Rent' : 'For Sale'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                {propertyLabel}
              </span>
              {listing.status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  ● Active
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{listing.location}
                </span>
                {listing.bedrooms != null && listing.bedrooms > 0 && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3 h-3" />{listing.bedrooms} bd
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-foreground">{priceLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Listing #{listing.listingNumber}
            </div>
          </div>

          {/* URL row */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Listing URL</p>
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
              <p className="text-xs font-mono text-primary flex-1 truncate">{url}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                ) : (
                  <><ClipboardCopy className="w-3.5 h-3.5" /><span>Copy</span></>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onCreateAnother}>
              Create Another
            </Button>
            <Button className="flex-1" onClick={onViewAll}>
              View Listing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function NewListing() {
  const navigate = useNavigate();
  const [createdListing, setCreatedListing] = useState<Listing | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);

  // Local state for totalCommissionPct (UI only, not sent to API)
  const [totalCommissionPct, setTotalCommissionPct] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      listingType: 'RENTAL',
      nature: 'RESIDENTIAL',
      propertyType: '',
      location: '',
      nearbyLandmarks: [],
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      areaSqft: undefined,
      areaUnit: 'sqft',
      description: '',
      amenities: [],
      status: 'ACTIVE',
      agentCommissionPct: 0,
      promoterCommissionPct: 0,
      companyCommissionPct: 0,
    },
  });

  // Watch values for live previews
  const watchedPropertyType = watch('propertyType');
  const watchedListingType = watch('listingType');
  const watchedLocation = watch('location');
  const watchedPrice = watch('price');
  const watchedBedrooms = watch('bedrooms');
  const watchedBathrooms = watch('bathrooms');
  const watchedNature = watch('nature');
  const watchedAreaSqft = watch('areaSqft');
  const watchedAreaUnit = watch('areaUnit');
  const watchedAgentPct = watch('agentCommissionPct');
  const watchedPromoterPct = watch('promoterCommissionPct');
  const watchedCompanyPct = watch('companyCommissionPct');
  const watchedAmenities = watch('amenities');
  const watchedDescription = watch('description');

  // Commission share validation
  const totalNum = parseFloat(totalCommissionPct) || 0;
  const sharesSum = (watchedAgentPct || 0) + (watchedCompanyPct || 0) + (watchedPromoterPct || 0);
  const sharesBalanced = totalNum > 0 && Math.abs(sharesSum - totalNum) < 0.001;

  const [isGenerating, setIsGenerating] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: ListingFormValues) =>
      api.post<Listing>('/api/listings', { ...data, images: uploadedImages, videos: uploadedVideos }),
    onSuccess: (listing) => {
      toast.success('Listing created!', { description: 'Your listing is now live.' });
      setCreatedListing(listing);
      setShowSuccess(true);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to create listing', { description: msg });
    },
  });

  const onSubmit = (data: ListingFormValues) => createMutation.mutate(data);

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
      const result = await api.post<{ description: string }>('/api/listings/generate-description', {
        propertyType: watchedPropertyType,
        listingType: watchedListingType,
        location: watchedLocation,
        bedrooms: watchedBedrooms,
        bathrooms: watchedBathrooms,
        areaSqft: watchedAreaSqft,
        amenities: watchedAmenities,
      });
      setValue('description', result.description);
    } catch {
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAnother = () => {
    reset();
    setTotalCommissionPct('');
    setShowSuccess(false);
    setCreatedListing(null);
    setUploadedImages([]);
    setUploadedVideos([]);
  };

  const toggleAmenity = (amenity: string, current: string[]) => {
    if (current.includes(amenity)) {
      setValue('amenities', current.filter((a) => a !== amenity));
    } else {
      setValue('amenities', [...current, amenity]);
    }
  };

  return (
    <DashboardLayout title="New Listing">
      <div className="p-5 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 space-y-4 w-full">

              {/* Section 1: Basic Information */}
              <SectionCard title="Basic Information">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g. Spacious 3-Bed Apartment in Westlands"
                      className="h-10"
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Listing Type */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Listing Type</Label>
                    <Controller
                      control={control}
                      name="listingType"
                      render={({ field }) => (
                        <div className="flex gap-2">
                          {(['RENTAL', 'SALE'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => field.onChange(type)}
                              className={cn(
                                'flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                                field.value === type
                                  ? type === 'RENTAL'
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                              )}
                            >
                              {type === 'RENTAL' ? 'For Rent' : 'For Sale'}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  {/* Nature */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nature</Label>
                    <Controller
                      control={control}
                      name="nature"
                      render={({ field }) => (
                        <div className="flex gap-2">
                          {(['RESIDENTIAL', 'COMMERCIAL', 'MIXED'] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              className={cn(
                                'flex-1 py-2 rounded-lg border text-xs font-medium transition-all',
                                field.value === n
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                              )}
                            >
                              {n === 'MIXED' ? 'Mixed Use' : n.charAt(0) + n.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  {/* Property Type */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Property Type <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="propertyType"
                      render={({ field }) => (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {PROPERTY_TYPES.map(({ label, value, icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                                field.value === value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                              )}
                            >
                              {icon}
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    {errors.propertyType && (
                      <p className="text-xs text-destructive">{errors.propertyType.message}</p>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Section 2: Location */}
              <SectionCard title="Location">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g. Westlands, Nairobi"
                        className="h-10 pl-9"
                        {...register('location')}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-xs text-destructive">{errors.location.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nearby Landmarks</Label>
                    <p className="text-xs text-muted-foreground">
                      Press Enter or comma to add a landmark
                    </p>
                    <Controller
                      control={control}
                      name="nearbyLandmarks"
                      render={({ field }) => (
                        <TagInput
                          values={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. Sarit Centre, ABC Place..."
                        />
                      )}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Section 3: Property Details */}
              <SectionCard title="Property Details">
                <div className="space-y-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="price"
                      render={({ field }) => (
                        <>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground select-none">
                              KES
                            </span>
                            <Input
                              id="price"
                              inputMode="numeric"
                              placeholder="e.g. 5,000,000"
                              className="h-10 pl-11"
                              value={field.value > 0 ? formatKES(field.value) : ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, '');
                                const num = parseFloat(raw);
                                field.onChange(isNaN(num) ? 0 : num);
                              }}
                            />
                          </div>
                          {field.value > 0 && (
                            <p className="text-xs text-muted-foreground">
                              KES {formatKES(field.value)}
                            </p>
                          )}
                        </>
                      )}
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>

                  {/* Bedrooms + Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name="bedrooms"
                      render={({ field }) => (
                        <NumberStepper
                          label="Bedrooms"
                          icon={<BedDouble className="w-4 h-4" />}
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="bathrooms"
                      render={({ field }) => (
                        <NumberStepper
                          label="Bathrooms"
                          icon={<Bath className="w-4 h-4" />}
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                        />
                      )}
                    />
                  </div>

                  {/* Area */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Square className="w-4 h-4 text-muted-foreground" />
                      Area
                    </Label>
                    <div className="flex gap-2">
                      <Controller
                        control={control}
                        name="areaSqft"
                        render={({ field }) => (
                          <Input
                            inputMode="numeric"
                            placeholder="e.g. 1,200"
                            className="h-10 flex-1"
                            value={field.value != null && field.value > 0 ? formatKES(field.value) : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, '');
                              const num = parseFloat(raw);
                              field.onChange(isNaN(num) ? undefined : num);
                            }}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="areaUnit"
                        render={({ field }) => (
                          <div className="flex border border-input rounded-md overflow-hidden">
                            {(['sqft', 'sqm'] as const).map((unit) => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => field.onChange(unit)}
                                className={cn(
                                  'px-3 text-xs font-medium transition-all',
                                  field.value === unit
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {unit}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="status" className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Section 4: Amenities */}
              <SectionCard title="Amenities">
                <Controller
                  control={control}
                  name="amenities"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map((amenity) => {
                        const selected = field.value.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity, field.value)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                              selected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-primary'
                            )}
                          >
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </SectionCard>

              {/* Section 5: Photos & Videos */}
              <SectionCard title="Photos & Videos">
                <MediaUpload
                  images={uploadedImages}
                  videos={uploadedVideos}
                  onImagesChange={setUploadedImages}
                  onVideosChange={setUploadedVideos}
                  disabled={createMutation.isPending}
                />
              </SectionCard>

              {/* Section 6: Description */}
              <SectionCard title="Description">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe the property in detail — layout, finishes, views, access, neighbourhood..."
                    rows={5}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {watchedDescription.length} chars (min 50)
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                </div>
              </SectionCard>

              {/* Section 6: Commission Structure */}
              <SectionCard title="Commission Structure">
                <div className="space-y-4">
                  {/* Total commission */}
                  <div className="space-y-1.5">
                    <Label htmlFor="totalCommissionPct" className="text-xs font-medium">
                      Total Commission from Landlord/Developer (%)
                    </Label>
                    <Input
                      id="totalCommissionPct"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="e.g. 3"
                      className="h-9 text-sm"
                      value={totalCommissionPct}
                      onChange={(e) => setTotalCommissionPct(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The agreed commission percentage payable by the landlord or developer
                    </p>
                  </div>

                  {/* Share splits */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        How is it split? <span className="text-foreground">(must add up to {totalNum > 0 ? `${totalNum}%` : 'total above'})</span>
                      </p>
                      {totalNum > 0 && (
                        <span className={`text-xs font-semibold ${sharesBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {Math.round(sharesSum * 100) / 100}% / {totalNum}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { name: 'agentCommissionPct', label: 'Agent (%)' },
                          { name: 'companyCommissionPct', label: 'Company (%)' },
                          { name: 'promoterCommissionPct', label: 'Promoter (%)' },
                        ] as const
                      ).map(({ name, label }) => (
                        <div key={name} className="space-y-1.5">
                          <Label htmlFor={name} className="text-xs font-medium">
                            {label}
                          </Label>
                          <Controller
                            control={control}
                            name={name}
                            render={({ field }) => (
                              <Input
                                id={name}
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                placeholder="0.00"
                                className="h-9 text-sm"
                                value={field.value === 0 ? '' : field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                                }
                              />
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Balance validation moved into preview card */}
                  </div>

                  <CommissionPreview
                    price={watchedPrice}
                    totalPct={totalNum}
                    agentPct={watchedAgentPct}
                    promoterPct={watchedPromoterPct}
                    companyPct={watchedCompanyPct}
                  />
                </div>
              </SectionCard>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </Button>
            </div>

            {/* ── RIGHT COLUMN (sticky, desktop only) ── */}
            <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0 sticky top-6 space-y-4">
              {/* Slug Preview */}
              <SlugPreviewCard
                propertyType={watchedPropertyType}
                listingType={watchedListingType}
                location={watchedLocation}
              />

              {/* Listing Summary */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Listing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {watchedListingType && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          watchedListingType === 'RENTAL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {watchedListingType === 'RENTAL' ? 'For Rent' : 'For Sale'}
                      </span>
                    )}
                    {watchedNature && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                        {watchedNature === 'MIXED'
                          ? 'Mixed Use'
                          : watchedNature.charAt(0) + watchedNature.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  {watchedPropertyType && (
                    <p className="text-muted-foreground">
                      Type:{' '}
                      <span className="font-semibold text-foreground">{watchedPropertyType}</span>
                    </p>
                  )}
                  {watchedLocation && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="text-foreground">{watchedLocation}</span>
                    </p>
                  )}
                  {watchedPrice > 0 && (
                    <p className="font-bold text-foreground text-base">
                      KES {formatKES(watchedPrice)}
                      {watchedListingType === 'RENTAL' ? '/mo' : ''}
                    </p>
                  )}
                  {(watchedBedrooms > 0 || watchedBathrooms > 0 || watchedAreaSqft) && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {watchedBedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" />
                          {watchedBedrooms}
                        </span>
                      )}
                      {watchedBathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3 h-3" />
                          {watchedBathrooms}
                        </span>
                      )}
                      {watchedAreaSqft && (
                        <span className="flex items-center gap-1">
                          <Square className="w-3 h-3" />
                          {formatKES(watchedAreaSqft)} {watchedAreaUnit}
                        </span>
                      )}
                    </div>
                  )}
                  {(!watchedPropertyType && !watchedLocation && !watchedPrice) && (
                    <p className="text-muted-foreground/60 italic">
                      Fill in the form to see a preview here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Success dialog */}
      <SuccessDialog
        open={showSuccess}
        listing={createdListing}
        onViewAll={() => createdListing
          ? navigate(`/dashboard/agent/listings/${createdListing.id}`)
          : navigate('/dashboard/agent/listings')}
        onCreateAnother={handleCreateAnother}
      />
    </DashboardLayout>
  );
}
