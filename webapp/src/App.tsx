import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import AgentSignup from "./pages/auth/AgentSignup";
import PromoterSignup from "./pages/auth/PromoterSignup";
import NotFound from "./pages/NotFound";

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
          <Route
            path="/dashboard/admin"
            element={
              <div className="flex items-center justify-center min-h-screen font-sans text-muted-foreground">
                Admin Dashboard — Coming Soon
              </div>
            }
          />
          <Route
            path="/dashboard/agent"
            element={
              <div className="flex items-center justify-center min-h-screen font-sans text-muted-foreground">
                Agent Dashboard — Coming Soon
              </div>
            }
          />
          <Route
            path="/dashboard/promoter"
            element={
              <div className="flex items-center justify-center min-h-screen font-sans text-muted-foreground">
                Promoter Dashboard — Coming Soon
              </div>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
