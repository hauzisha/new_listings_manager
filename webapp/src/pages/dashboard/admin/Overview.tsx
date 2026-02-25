import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LayoutDashboard } from 'lucide-react';

export default function AdminOverview() {
  return (
    <DashboardLayout title="Overview">
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Platform-wide analytics, revenue summaries, and key metrics will appear here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
