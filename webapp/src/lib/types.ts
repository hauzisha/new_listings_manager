export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'AGENT' | 'PROMOTER';
  isApproved: boolean;
  referrer?: { name: string; email: string } | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  recruiter_bonus_enabled: boolean;
  recruiter_bonus_amount: number;
  agent_response_sla_hours: number;
  stale_inquiry_threshold_days: number;
}

export interface Listing {
  id: string;
  listingNumber: number;
  title: string;
  slug: string;
  listingType: 'RENTAL' | 'SALE';
  nature: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';
  propertyType: string;
  location: string;
  nearbyLandmarks: string[];
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  areaUnit: 'sqft' | 'sqm';
  description: string;
  amenities: string[];
  images: string[];
  videos: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'RENTED';
  agentCommissionPct: number;
  promoterCommissionPct: number;
  companyCommissionPct: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
