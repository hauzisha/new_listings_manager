import { TrendingUp } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function PromoterStats() {
  return (
    <PlaceholderPage
      title="Stats"
      description="Detailed performance analytics for your promotions — clicks, views, lead conversions, and earnings over time."
      Icon={TrendingUp}
    />
  );
}
