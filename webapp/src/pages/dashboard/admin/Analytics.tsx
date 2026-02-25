import { BarChart3 } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AdminAnalytics() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Deep-dive into platform performance metrics, user growth trends, listing activity, and revenue analytics."
      Icon={BarChart3}
    />
  );
}
