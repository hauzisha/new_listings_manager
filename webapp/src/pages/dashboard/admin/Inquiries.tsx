import { MessageSquare } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AdminInquiries() {
  return (
    <PlaceholderPage
      title="Inquiries"
      description="Monitor all buyer inquiries across the platform, track response times, and flag stale or overdue inquiries."
      Icon={MessageSquare}
    />
  );
}
