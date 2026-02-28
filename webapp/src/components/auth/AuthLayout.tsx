import { Link } from "react-router-dom";
import { Building2, Star } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const testimonials = [
  {
    name: "Sarah Mwangi",
    role: "Property Agent, Nairobi",
    quote:
      "Hauzisha transformed my business. I closed 12 deals in my first month and the promoter network brought me leads I never would have found on my own.",
    stars: 5,
  },
  {
    name: "David Ochieng",
    role: "Top Promoter",
    quote:
      "I earn passive income just by sharing property links with my network. The tracking and commission system is transparent and payments are always on time.",
    stars: 5,
  },
  {
    name: "Amina Hassan",
    role: "Agent @ Coastal Properties",
    quote:
      "The platform is incredibly easy to use. I listed my first property in under 5 minutes and had inquiries coming in the same day.",
    stars: 5,
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  // Pick a testimonial based on the current minute to cycle through them
  const testimonial = testimonials[new Date().getMinutes() % testimonials.length];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — form area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-foreground text-xl font-bold italic">
              Hauzisha
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup/agent"
              className="text-primary font-medium hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* Right — testimonial panel (hidden on mobile) */}
      <div className="hidden lg:flex w-[420px] xl:w-[480px] bg-muted/40 border-l border-border flex-col items-center justify-center p-10 xl:p-14">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-sm w-full">
          {/* Quote mark */}
          <div className="text-primary/20 text-6xl font-serif leading-none mb-2 select-none">
            &ldquo;
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {testimonial.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          </div>

          {/* Name & role */}
          <div className="text-center mb-5">
            <p className="font-semibold text-foreground">{testimonial.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {testimonial.role}
            </p>
          </div>

          {/* Quote */}
          <p className="text-center text-muted-foreground text-sm leading-relaxed italic mb-5">
            &ldquo;{testimonial.quote}&rdquo;
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: testimonial.stars }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
