import { Building2 } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function AdminListings() {
  return (
    <PlaceholderPage
      title="Listings"
      description="Manage all property listings across the platform, approve or reject new listings, and monitor listing quality."
      Icon={Building2}
    />
  );
}
