import { DollarSign } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function PromoterCommissions() {
  return (
    <PlaceholderPage
      title="Commissions"
      description="View your commission earnings from successful property promotions. Track pending and paid commission balances."
      Icon={DollarSign}
    />
  );
}
