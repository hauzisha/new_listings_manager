import { Search } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function PromoterListings() {
  return (
    <PlaceholderPage
      title="Browse Properties"
      description="Discover properties available for promotion. Filter by location, type, and commission rate to find the best opportunities."
      Icon={Search}
    />
  );
}
