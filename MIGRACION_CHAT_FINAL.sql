-- Add chat_id column to direct_messages table for better conversation management
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS chat_id UUID DEFAULT gen_random_uuid();

-- Add chat_id column to message_threads table
ALTER TABLE public.message_threads 
ADD COLUMN IF NOT EXISTS chat_id UUID DEFAULT gen_random_uuid();

-- Create function to generate or get existing chat_id
CREATE OR REPLACE FUNCTION public.get_or_create_chat_id(
  property_id UUID,
  buyer_id UUID,
  seller_id UUID
)
RETURNS UUID AS $$
DECLARE
  existing_chat_id UUID;
BEGIN
  SELECT chat_id INTO existing_chat_id
  FROM public.message_threads
  WHERE property_id = $1 
    AND buyer_id = $2 
    AND seller_id = $3;
  
  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;
  
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new messages with chat_id
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id UUID;
  chat_id_val UUID;
BEGIN
  SELECT user_id INTO property_owner_id
  FROM public.properties
  WHERE id = NEW.property_id;
  
  IF NEW.sender_id = property_owner_id THEN
    chat_id_val := public.get_or_create_chat_id(NEW.property_id, NEW.receiver_id, NEW.sender_id);
  ELSE
    chat_id_val := public.get_or_create_chat_id(NEW.property_id, NEW.sender_id, NEW.receiver_id);
  END IF;
  
  NEW.chat_id := chat_id_val;
  
  INSERT INTO public.message_threads (
    property_id,
    buyer_id,
    seller_id,
    chat_id,
    last_message_at,
    updated_at
  )
  VALUES (
    NEW.property_id,
    CASE WHEN NEW.sender_id = property_owner_id THEN NEW.receiver_id ELSE NEW.sender_id END,
    property_owner_id,
    chat_id_val,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (property_id, buyer_id, seller_id) DO UPDATE SET
    last_message_at = EXCLUDED.last_message_at,
    updated_at = NOW(),
    chat_id = EXCLUDED.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_handle_new_message ON public.direct_messages;
CREATE TRIGGER trigger_handle_new_message
  BEFORE INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- Update existing messages to have chat_id
UPDATE public.direct_messages 
SET chat_id = (
  SELECT chat_id 
  FROM public.message_threads 
  WHERE property_id = direct_messages.property_id 
    AND buyer_id = CASE 
      WHEN direct_messages.sender_id = (SELECT user_id FROM properties WHERE id = direct_messages.property_id) 
      THEN direct_messages.receiver_id 
      ELSE direct_messages.sender_id 
    END
    AND seller_id = (SELECT user_id FROM properties WHERE id = direct_messages.property_id)
)
WHERE chat_id IS NULL;

-- Update existing message_threads to have chat_id
UPDATE public.message_threads 
SET chat_id = gen_random_uuid()
WHERE chat_id IS NULL;

-- Make chat_id NOT NULL after updating existing records
ALTER TABLE public.direct_messages 
ALTER COLUMN chat_id SET NOT NULL;

ALTER TABLE public.message_threads 
ALTER COLUMN chat_id SET NOT NULL;

-- Add unique constraint on chat_id for message_threads (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_chat_id' 
    AND conrelid = 'public.message_threads'::regclass
  ) THEN
    ALTER TABLE public.message_threads 
    ADD CONSTRAINT unique_chat_id UNIQUE (chat_id);
  END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_chat_id(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_message() TO authenticated;
