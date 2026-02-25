import { DollarSign } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AdminCommissions() {
  return (
    <PlaceholderPage
      title="Commissions"
      description="Review and approve commission payments for agents and promoters. Track all earned and pending commissions."
      Icon={DollarSign}
    />
  );
}
