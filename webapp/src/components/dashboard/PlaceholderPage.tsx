import type { LucideIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface PlaceholderPageProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export function PlaceholderPage({ title, description, Icon }: PlaceholderPageProps) {
  return (
    <DashboardLayout title={title}>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm max-w-xs mt-2">{description}</p>
          </div>
          <div className="mt-2 px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground font-medium">
            Coming Soon
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
