-- Add is_read column to property_favorites table
ALTER TABLE public.property_favorites 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add is_read column to property_inquiries table
ALTER TABLE public.property_inquiries 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add is_read column to property_comment_replies table (if not already exists)
ALTER TABLE public.property_comment_replies 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add is_read column to direct_messages table (if not already exists)
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(
  notification_ids UUID[],
  notification_type TEXT
)
RETURNS VOID AS $$
BEGIN
  CASE notification_type
    WHEN 'favorite' THEN
      UPDATE public.property_favorites 
      SET is_read = TRUE 
      WHERE id = ANY(notification_ids);
    WHEN 'inquiry' THEN
      UPDATE public.property_inquiries 
      SET is_read = TRUE 
      WHERE id = ANY(notification_ids);
    WHEN 'comment' THEN
      UPDATE public.property_comment_replies 
      SET is_read = TRUE 
      WHERE id = ANY(notification_ids);
    WHEN 'message' THEN
      UPDATE public.direct_messages 
      SET is_read = TRUE 
      WHERE id = ANY(notification_ids);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.mark_notifications_as_read(UUID[], TEXT) TO authenticated;
