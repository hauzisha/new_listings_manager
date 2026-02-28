import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Building2,
  Users,
  TrendingUp,
  Search,
  ArrowRight,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";
import MarketplaceNav from "@/components/marketplace/MarketplaceNav";
import ListingCard from "@/components/marketplace/ListingCard";

interface PublicListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-12" />
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

const STATS = [
  { icon: Building2, value: "12,000+", label: "Properties" },
  { icon: MapPin, value: "47", label: "Counties" },
  { icon: Users, value: "3,500+", label: "Trusted Agents" },
  { icon: TrendingUp, value: "8,200+", label: "Deals Closed" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Find Your Perfect Home",
    description:
      "Browse thousands of verified properties across all 47 counties. Filter by location, price, type, and more. Connect directly with agents.",
    link: "/listings",
    linkLabel: "Browse Properties",
  },
  {
    icon: Building2,
    title: "List & Manage Properties",
    description:
      "Create beautiful listings, track inquiries, manage commissions, and grow your real estate business with powerful tools.",
    link: "/signup/agent",
    linkLabel: "Start Listing",
  },
  {
    icon: Megaphone,
    title: "Earn by Sharing",
    description:
      "Share property links with your network and earn commission on every successful deal. Track your earnings in real time.",
    link: "/signup/promoter",
    linkLabel: "Become a Promoter",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Browse & Discover",
    description:
      "Search properties across Kenya by location, price, type, and more. Every listing is verified.",
  },
  {
    number: 2,
    title: "Connect with Agents",
    description:
      "Found something you like? Send an inquiry directly to the listing agent. They'll get back to you fast.",
  },
  {
    number: 3,
    title: "Close the Deal",
    description:
      "Visit the property, negotiate terms, and close. Promoters earn their commission automatically.",
  },
];

export default function Homepage() {
  const { data, isLoading } = useQuery<PublicListingsResponse>({
    queryKey: ["featured-listings"],
    queryFn: () =>
      api.get<PublicListingsResponse>("/api/listings/public?limit=6&sort=newest"),
    staleTime: 5 * 60_000,
  });

  const listings = data?.listings ?? [];

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/[0.06] blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-8">
            <MapPin className="w-3.5 h-3.5" />
            Kenya's Premier Property Marketplace
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
            Find Your Dream{" "}
            <span className="text-primary">Property</span> in Kenya
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Browse verified listings, connect with trusted agents, and earn
            commissions as a promoter. All in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button asChild size="lg" className="h-12 px-8 text-base font-medium rounded-xl shadow-lg shadow-primary/20">
              <Link to="/listings">
                Browse Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl">
              <Link to="/signup/agent">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-3xl md:text-4xl font-bold text-foreground font-display tracking-tight">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Featured Properties
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              Explore Top Properties
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Hand-picked listings from Kenya's most sought-after locations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
          </div>

          {!isLoading && listings.length > 0 && (
            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
                <Link to="/listings">
                  View All Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Why Hauzisha ─────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Why Hauzisha
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              Built for Everyone in Real Estate
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Whether you're buying, listing, or promoting — we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description, link, linkLabel }) => (
              <div
                key={title}
                className="bg-card rounded-2xl border border-border p-8 card-hover flex flex-col"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {description}
                </p>
                <Link
                  to={link}
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-5 hover:underline"
                >
                  {linkLabel}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              How It Works
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              Get Started in Three Steps
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px border-t-2 border-dashed border-border" />

            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="relative text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 relative z-10">
                  {number}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="px-4 md:px-8 pb-20 md:pb-24">
        <div className="relative max-w-5xl mx-auto bg-primary rounded-3xl px-8 py-16 md:py-20 text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-display">
              Ready to Find Your Next Property?
            </h2>
            <p className="mt-4 text-white/70 text-lg max-w-lg mx-auto">
              Join thousands of buyers, agents, and promoters already using Hauzisha.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base font-medium rounded-xl bg-white text-primary hover:bg-white/90"
              >
                <Link to="/listings">Browse Properties</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-medium rounded-xl border-white/30 text-white hover:bg-white/10"
              >
                <Link to="/signup/agent">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold italic text-xl text-foreground">
                  Hauzisha
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kenya's premier property marketplace connecting buyers, agents,
                and promoters.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Marketplace
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Browse Properties
                  </Link>
                </li>
                <li>
                  <Link to="/listings?type=SALE" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    For Sale
                  </Link>
                </li>
                <li>
                  <Link to="/listings?type=RENTAL" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    For Rent
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Get Started
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup/agent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Agent Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/signup/promoter" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Promoter Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <span className="text-sm text-muted-foreground">About</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Contact</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Terms</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>&copy; 2026 Hauzisha. All rights reserved.</p>
            <p>Kenya's Premier Property Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
