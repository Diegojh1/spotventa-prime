-- Create storage buckets for avatars and property images
-- Note: This is a placeholder migration. You'll need to create these buckets manually in the Supabase dashboard
-- or use the Supabase CLI if available

-- For avatars bucket:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "avatars"
-- 3. Set it to public
-- 4. Add RLS policies

-- For property-images bucket:
-- 1. Go to Storage in Supabase Dashboard  
-- 2. Create a new bucket called "property-images"
-- 3. Set it to public
-- 4. Add RLS policies

-- RLS Policies for avatars bucket:
-- INSERT: Users can upload their own avatar
-- SELECT: Anyone can view avatars
-- UPDATE: Users can update their own avatar
-- DELETE: Users can delete their own avatar

-- RLS Policies for property-images bucket:
-- INSERT: Authenticated users can upload property images
-- SELECT: Anyone can view property images
-- UPDATE: Property owners can update their property images
-- DELETE: Property owners can delete their property images
