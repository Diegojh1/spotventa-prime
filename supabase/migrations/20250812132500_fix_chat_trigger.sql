-- Fix the handle_new_message trigger to resolve ambiguous column references
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_handle_new_message ON public.direct_messages;
DROP FUNCTION IF EXISTS public.handle_new_message();

-- Create the fixed function with explicit table references
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id UUID;
  chat_id_val UUID;
BEGIN
  -- Get property owner with explicit table reference
  SELECT p.user_id INTO property_owner_id
  FROM public.properties p
  WHERE p.id = NEW.property_id;
  
  -- Determine chat_id based on sender/receiver relationship
  IF NEW.sender_id = property_owner_id THEN
    chat_id_val := public.get_or_create_chat_id(NEW.property_id, NEW.receiver_id, NEW.sender_id);
  ELSE
    chat_id_val := public.get_or_create_chat_id(NEW.property_id, NEW.sender_id, NEW.receiver_id);
  END IF;
  
  -- Set the chat_id for the new message
  NEW.chat_id := chat_id_val;
  
  -- Insert or update message thread with explicit table references
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

-- Recreate the trigger
CREATE TRIGGER trigger_handle_new_message
  BEFORE INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- Also fix the get_or_create_chat_id function to be more explicit
CREATE OR REPLACE FUNCTION public.get_or_create_chat_id(
  property_id UUID,
  buyer_id UUID,
  seller_id UUID
)
RETURNS UUID AS $$
DECLARE
  existing_chat_id UUID;
BEGIN
  -- Use explicit table reference
  SELECT mt.chat_id INTO existing_chat_id
  FROM public.message_threads mt
  WHERE mt.property_id = $1 
    AND mt.buyer_id = $2 
    AND mt.seller_id = $3;
  
  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;
  
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_chat_id(UUID, UUID, UUID) TO authenticated;
