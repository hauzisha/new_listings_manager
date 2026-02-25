import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ArrowLeft,
  AlertTriangle,
  Castle,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NumberStepper } from '@/components/listings/NumberStepper';
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED']),
  agentCommissionPct: z.number().min(0).max(100),
  promoterCommissionPct: z.number().min(0).max(100),
  companyCommissionPct: z.number().min(0).max(100),
});

type ListingFormValues = z.infer<typeof listingSchema>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES: { label: string; icon: React.ReactNode }[] = [
  { label: 'Apartment', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Maisonette', icon: <Home className="w-5 h-5" /> },
  { label: 'Villa', icon: <Castle className="w-5 h-5" /> },
  { label: 'Studio', icon: <Layers className="w-5 h-5" /> },
  { label: 'Bungalow', icon: <House className="w-5 h-5" /> },
  { label: 'Duplex', icon: <Copy className="w-5 h-5" /> },
  { label: 'Penthouse', icon: <Star className="w-5 h-5" /> },
  { label: 'Townhouse', icon: <Hotel className="w-5 h-5" /> },
  { label: 'Commercial Space', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Land', icon: <Map className="w-5 h-5" /> },
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
          <span className="text-muted-foreground">Total payable by landlord</span>
          <span className="font-semibold text-foreground">
            {fmt(totalAmt)} ({totalPct}%)
          </span>
        </div>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Agent earns</span>
        <span className="font-semibold text-foreground">
          {fmt(agentAmt)} ({agentPct}%)
        </span>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Company earns</span>
        <span className="font-semibold text-foreground">
          {fmt(companyAmt)} ({companyPct}%)
        </span>
      </div>
      <div className="flex justify-between pl-3">
        <span className="text-muted-foreground">└─ Promoter earns</span>
        <span className="font-semibold text-foreground">
          {fmt(promoterAmt)} ({promoterPct}%)
        </span>
      </div>
    </div>
  );
}

// ─── Form Skeleton ──────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function EditListing() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Local state for totalCommissionPct (UI only, not sent to API)
  const [totalCommissionPct, setTotalCommissionPct] = useState<string>('');

  const {
    data: listing,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<Listing>(`/api/listings/${id}`),
    enabled: !!id,
    retry: (failureCount, err) => {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 404) return false;
      return failureCount < 2;
    },
  });

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

  // Prefill form when data loads
  useEffect(() => {
    if (listing) {
      const agent = listing.agentCommissionPct ?? 0;
      const promoter = listing.promoterCommissionPct ?? 0;
      const company = listing.companyCommissionPct ?? 0;
      const computedTotal = agent + promoter + company;

      reset({
        title: listing.title,
        listingType: listing.listingType,
        nature: listing.nature,
        propertyType: listing.propertyType,
        location: listing.location,
        nearbyLandmarks: listing.nearbyLandmarks,
        price: listing.price,
        bedrooms: listing.bedrooms ?? 0,
        bathrooms: listing.bathrooms ?? 0,
        areaSqft: listing.areaSqft,
        areaUnit: listing.areaUnit,
        description: listing.description,
        amenities: listing.amenities,
        status: listing.status === 'SOLD' || listing.status === 'RENTED' ? listing.status : listing.status,
        agentCommissionPct: agent,
        promoterCommissionPct: promoter,
        companyCommissionPct: company,
      });

      // Set the computed total for the UI
      if (computedTotal > 0) {
        setTotalCommissionPct(String(computedTotal));
      }
    }
  }, [listing, reset]);

  const watchedPrice = watch('price');
  const watchedAgentPct = watch('agentCommissionPct');
  const watchedPromoterPct = watch('promoterCommissionPct');
  const watchedCompanyPct = watch('companyCommissionPct');
  const watchedAmenities = watch('amenities');
  const watchedDescription = watch('description');
  const watchedPropertyType = watch('propertyType');
  const watchedListingType = watch('listingType');
  const watchedLocation = watch('location');
  const watchedBedrooms = watch('bedrooms');
  const watchedBathrooms = watch('bathrooms');
  const watchedAreaSqft = watch('areaSqft');

  // Commission share validation
  const totalNum = parseFloat(totalCommissionPct) || 0;
  const sharesSum = (watchedAgentPct || 0) + (watchedCompanyPct || 0) + (watchedPromoterPct || 0);
  const sharesBalanced = totalNum > 0 && Math.abs(sharesSum - totalNum) < 0.001;

  const updateMutation = useMutation({
    mutationFn: (data: ListingFormValues) =>
      api.put<Listing>(`/api/listings/${id}`, { ...data, images: listing?.images ?? [] }),
    onSuccess: () => {
      toast.success('Listing updated');
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['agent-listings'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to update listing', { description: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/api/listings/${id}`),
    onSuccess: () => {
      toast.success('Listing deactivated');
      queryClient.invalidateQueries({ queryKey: ['agent-listings'] });
      navigate('/dashboard/agent/listings');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to deactivate listing', { description: msg });
    },
  });

  const onSubmit = (data: ListingFormValues) => updateMutation.mutate(data);

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

  const toggleAmenity = (amenity: string, current: string[]) => {
    if (current.includes(amenity)) {
      setValue('amenities', current.filter((a) => a !== amenity));
    } else {
      setValue('amenities', [...current, amenity]);
    }
  };

  // Not found state
  const notFound =
    isError && (error as { status?: number })?.status === 404;

  if (notFound) {
    return (
      <DashboardLayout title="Edit Listing">
        <div className="p-5 md:p-6 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">Listing not found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            This listing doesn't exist or you don't have access to it.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard/agent/listings')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Listings
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Listing">
      <div className="p-5 md:p-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/dashboard/agent/listings')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>

        {isLoading ? (
          <FormSkeleton />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* ── LEFT COLUMN ── */}
              <div className="flex-1 space-y-4 w-full">

                {/* Section 1: Basic Information */}
                <SectionCard title="Basic Information">
                  <div className="space-y-4">
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

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        Property Type <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        control={control}
                        name="propertyType"
                        render={({ field }) => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {PROPERTY_TYPES.map(({ label, icon }) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => field.onChange(label)}
                                className={cn(
                                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                                  field.value === label
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

                    {/* Current slug (read-only) */}
                    {listing?.slug && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          Current URL Slug
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            <Info className="w-3 h-3" />
                            Read-only
                          </span>
                        </Label>
                        <div className="bg-muted rounded-md px-3 py-2.5">
                          <p className="text-xs font-mono text-muted-foreground">
                            {listing.slug}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Slug cannot be changed after creation.
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Section 3: Property Details */}
                <SectionCard title="Property Details">
                  <div className="space-y-4">
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
                              <SelectItem value="SOLD">Sold</SelectItem>
                              <SelectItem value="RENTED">Rented</SelectItem>
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

                {/* Section 5: Description */}
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
                        {(watchedDescription ?? '').length} chars (min 50)
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
                      <p className="text-xs font-medium text-muted-foreground">Split among:</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            { name: 'agentCommissionPct', label: 'Agent Share (%)' },
                            { name: 'companyCommissionPct', label: 'Company Share (%)' },
                            { name: 'promoterCommissionPct', label: 'Promoter Share (%)' },
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

                      {/* Balance validation */}
                      {totalNum > 0 && (
                        sharesBalanced ? (
                          <p className="text-xs text-emerald-600 font-medium">
                            Shares balance correctly
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 font-medium">
                            Shares must add up to {totalNum}% (currently {Math.round(sharesSum * 100) / 100}%)
                          </p>
                        )
                      )}
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

                {/* Submit + Deactivate */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full h-10"
                    onClick={() => setShowDeactivate(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Deactivate Listing
                  </Button>
                </div>
              </div>

              {/* ── RIGHT COLUMN (sticky, desktop only) ── */}
              <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0 sticky top-6 space-y-4">
                {/* Listing info */}
                {listing && (
                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Listing Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <p className="text-muted-foreground">
                        Number:{' '}
                        <span className="font-mono font-semibold text-foreground">
                          #{String(listing.listingNumber).padStart(6, '0')}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Slug:{' '}
                        <span className="font-mono text-primary">{listing.slug}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Created:{' '}
                        <span className="text-foreground">
                          {new Date(listing.createdAt).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Deactivate confirmation dialog */}
      <AlertDialog open={showDeactivate} onOpenChange={setShowDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing and remove it from the platform. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
