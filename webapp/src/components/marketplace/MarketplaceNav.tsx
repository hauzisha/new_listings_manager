import { Link } from "react-router-dom";
import { Building2, ChevronRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function MarketplaceNav() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            to="/listings"
            className="flex items-center gap-2 group"
            aria-label="Hauzisha home"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-display font-bold italic text-xl text-foreground tracking-tight">
              Hauzisha
            </span>
          </Link>

          {/* Right side actions */}
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" className="gap-1.5 font-medium">
                <Link to="/dashboard/agent">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Open Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="gap-1.5 font-medium shadow-sm">
                  <Link to="/signup/agent">
                    Get Started
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
