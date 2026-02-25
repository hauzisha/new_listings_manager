import { MessageSquare } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AgentInquiries() {
  return (
    <PlaceholderPage
      title="Inquiries"
      description="View and respond to buyer inquiries on your listings. Track inquiry status and stay within your response time targets."
      Icon={MessageSquare}
    />
  );
}
