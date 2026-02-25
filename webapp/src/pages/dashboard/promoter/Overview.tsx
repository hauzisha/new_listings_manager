import { LayoutDashboard } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function PromoterOverview() {
  return (
    <PlaceholderPage
      title="Overview"
      description="Your promoter dashboard showing active promotions, clicks, conversions, and total commission earnings at a glance."
      Icon={LayoutDashboard}
    />
  );
}
