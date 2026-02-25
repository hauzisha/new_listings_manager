import { MapPin, Home, TrendingUp, Building2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const propertyCards = [
  { icon: Home, label: "3 Bed Apartment", location: "Westlands, Nairobi", price: "KES 8.5M" },
  { icon: Building2, label: "2 Bed Studio", location: "Kilimani, Nairobi", price: "KES 4.2M" },
  { icon: TrendingUp, label: "Commercial Space", location: "CBD, Nairobi", price: "KES 15M" },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative bg-primary flex-col justify-between overflow-hidden">
        {/* Dot-grid background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Diagonal overlay for depth */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.3) 40px,
              rgba(255,255,255,0.3) 41px
            )`,
          }}
        />

        {/* Top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/80 to-transparent z-10" />
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/90 to-transparent z-10" />

        {/* Content */}
        <div className="relative z-20 flex flex-col h-full p-10 lg:p-14">
          {/* Wordmark */}
          <div>
            <h1 className="font-display text-white text-4xl lg:text-5xl font-bold italic tracking-tight">
              Hauzisha
            </h1>
            <p className="text-white/60 text-sm mt-1 font-sans tracking-widest uppercase">
              Kenya's Premier Property Platform
            </p>
          </div>

          {/* Center decorative property cards */}
          <div className="flex-1 flex flex-col justify-center gap-4 mt-10">
            {propertyCards.map((card, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 shadow-lg"
                style={{ transform: `translateX(${i % 2 === 0 ? "0" : "24px"})` }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm font-sans">{card.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-white/50 flex-shrink-0" />
                    <span className="text-white/50 text-xs font-sans truncate">{card.location}</span>
                  </div>
                </div>
                <span className="text-accent font-semibold text-sm font-sans flex-shrink-0">
                  {card.price}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <div className="relative z-20">
            <div className="border-t border-white/20 pt-6">
              <p className="text-white/70 text-sm font-sans leading-relaxed max-w-sm">
                Connecting buyers, agents &amp; promoters across Kenya — from Nairobi to Mombasa.
              </p>
              <div className="flex items-center gap-6 mt-5">
                <div>
                  <p className="text-white font-bold text-xl font-display">12,000+</p>
                  <p className="text-white/50 text-xs font-sans mt-0.5">Properties Listed</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white font-bold text-xl font-display">3,500+</p>
                  <p className="text-white/50 text-xs font-sans mt-0.5">Active Agents</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white font-bold text-xl font-display">47</p>
                  <p className="text-white/50 text-xs font-sans mt-0.5">Counties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-background min-h-screen md:min-h-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card md:px-10">
          <span className="font-display text-primary text-2xl font-bold italic">Hauzisha</span>
          <span className="text-muted-foreground text-xs font-sans hidden sm:block">
            Kenya's Premier Property Platform
          </span>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-start md:items-center justify-center px-6 py-8 md:px-10 lg:px-16 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h2 className="font-display text-3xl font-bold text-foreground">{title}</h2>
              <p className="text-muted-foreground text-sm mt-2 font-sans">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
