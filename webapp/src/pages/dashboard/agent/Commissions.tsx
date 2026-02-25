import { DollarSign } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AgentCommissions() {
  return (
    <PlaceholderPage
      title="Commissions"
      description="Track your earned commissions from closed deals and referral bonuses from promoters you recruited."
      Icon={DollarSign}
    />
  );
}
