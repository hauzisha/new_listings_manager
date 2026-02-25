import { LayoutDashboard } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AgentOverview() {
  return (
    <PlaceholderPage
      title="Overview"
      description="Your personal dashboard showing active listings, recent inquiries, commission earnings, and performance summary."
      Icon={LayoutDashboard}
    />
  );
}
