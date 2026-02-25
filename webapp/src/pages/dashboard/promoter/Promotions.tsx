import { Megaphone } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function PromoterPromotions() {
  return (
    <PlaceholderPage
      title="My Promotions"
      description="Manage your active and past property promotions. Track which properties you are currently promoting and their performance."
      Icon={Megaphone}
    />
  );
}
