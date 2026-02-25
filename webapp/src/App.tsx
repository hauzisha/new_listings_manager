import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import AgentSignup from "./pages/auth/AgentSignup";
import PromoterSignup from "./pages/auth/PromoterSignup";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminOverview from "./pages/dashboard/admin/Overview";
import AdminUsers from "./pages/dashboard/admin/Users";
import AdminSettings from "./pages/dashboard/admin/Settings";
import AdminListings from "./pages/dashboard/admin/Listings";
import AdminInquiries from "./pages/dashboard/admin/Inquiries";
import AdminCommissions from "./pages/dashboard/admin/Commissions";
import AdminAnalytics from "./pages/dashboard/admin/Analytics";

// Agent pages
import AgentOverview from "./pages/dashboard/agent/Overview";
import AgentListings from "./pages/dashboard/agent/Listings";
import AgentInquiries from "./pages/dashboard/agent/Inquiries";
import AgentTrackingLinks from "./pages/dashboard/agent/TrackingLinks";
import AgentCommissions from "./pages/dashboard/agent/Commissions";

// Promoter pages
import PromoterOverview from "./pages/dashboard/promoter/Overview";
import PromoterListings from "./pages/dashboard/promoter/Listings";
import PromoterPromotions from "./pages/dashboard/promoter/Promotions";
import PromoterTrackingLinks from "./pages/dashboard/promoter/TrackingLinks";
import PromoterStats from "./pages/dashboard/promoter/Stats";
import PromoterCommissions from "./pages/dashboard/promoter/Commissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/agent" element={<AgentSignup />} />
          <Route path="/signup/promoter" element={<PromoterSignup />} />

          {/* Admin routes */}
          <Route path="/dashboard/admin" element={<AdminOverview />} />
          <Route path="/dashboard/admin/users" element={<AdminUsers />} />
          <Route path="/dashboard/admin/settings" element={<AdminSettings />} />
          <Route path="/dashboard/admin/listings" element={<AdminListings />} />
          <Route path="/dashboard/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/dashboard/admin/commissions" element={<AdminCommissions />} />
          <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />

          {/* Agent routes */}
          <Route path="/dashboard/agent" element={<AgentOverview />} />
          <Route path="/dashboard/agent/listings" element={<AgentListings />} />
          <Route path="/dashboard/agent/inquiries" element={<AgentInquiries />} />
          <Route path="/dashboard/agent/tracking-links" element={<AgentTrackingLinks />} />
          <Route path="/dashboard/agent/commissions" element={<AgentCommissions />} />

          {/* Promoter routes */}
          <Route path="/dashboard/promoter" element={<PromoterOverview />} />
          <Route path="/dashboard/promoter/listings" element={<PromoterListings />} />
          <Route path="/dashboard/promoter/promotions" element={<PromoterPromotions />} />
          <Route path="/dashboard/promoter/tracking-links" element={<PromoterTrackingLinks />} />
          <Route path="/dashboard/promoter/stats" element={<PromoterStats />} />
          <Route path="/dashboard/promoter/commissions" element={<PromoterCommissions />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
