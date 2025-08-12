export interface Property {
  id: string;
  title: string;
  price: number;
  category: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  address: string;
  city: string;
  state_province?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  images: any; // jsonb type
  features: any; // jsonb type
  amenities?: string[];
  description?: string;
  year_built?: number;
  parking_spaces?: number;
  energy_rating?: string;
  is_featured?: boolean;
  is_active?: boolean;
  views_count?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  query?: string;
  category?: 'sale' | 'rent';
  property_type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  city?: string;
  features?: string[];
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  user_type?: 'buyer' | 'agent';
  plan_type?: 'free' | 'premium';
  company_name?: string;
  website?: string;
}