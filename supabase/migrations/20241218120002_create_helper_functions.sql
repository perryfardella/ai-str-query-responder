-- Migration: Create helper functions for WhatsApp message processing
-- Purpose: Database functions to support conversation management and message processing
-- Functions: get_or_create_conversation, update_conversation_last_message, get_property_for_phone_number

-- Function to get or create a conversation between two phone numbers
create or replace function public.get_or_create_conversation(
  p_user_id uuid,
  p_whatsapp_account_id bigint,
  p_customer_phone text,
  p_business_phone text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  conversation_id bigint;
  property_link_id bigint;
  conversation_identifier text;
begin
  -- Create conversation identifier
  conversation_identifier := p_customer_phone || '-' || p_business_phone;
  
  -- Try to find existing conversation
  select public.conversations.id
  into conversation_id
  from public.conversations
  where public.conversations.customer_phone_number = p_customer_phone
    and public.conversations.business_phone_number = p_business_phone
    and public.conversations.whatsapp_account_id = p_whatsapp_account_id
    and public.conversations.user_id = p_user_id;
  
  -- If conversation exists, return it
  if conversation_id is not null then
    return conversation_id;
  end if;
  
  -- Get current property link for this phone number if it exists
  select public.phone_number_property_links.id
  into property_link_id
  from public.phone_number_property_links
  where public.phone_number_property_links.customer_phone_number = p_customer_phone
    and public.phone_number_property_links.whatsapp_account_id = p_whatsapp_account_id
    and public.phone_number_property_links.user_id = p_user_id
    and public.phone_number_property_links.unlinked_at is null;
  
  -- Create new conversation
  insert into public.conversations (
    user_id,
    whatsapp_account_id,
    property_link_id,
    customer_phone_number,
    business_phone_number,
    conversation_identifier,
    status
  ) values (
    p_user_id,
    p_whatsapp_account_id,
    property_link_id,
    p_customer_phone,
    p_business_phone,
    conversation_identifier,
    'active'
  ) returning id into conversation_id;
  
  return conversation_id;
end;
$$;

comment on function public.get_or_create_conversation is 'Gets existing conversation or creates new one between customer and business phone numbers';

-- Function to update conversation metadata when new message arrives
create or replace function public.update_conversation_last_message(
  p_conversation_id bigint,
  p_message_direction text,
  p_message_timestamp timestamptz,
  p_needs_manual_review boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.conversations
  set 
    last_message_at = p_message_timestamp,
    last_message_direction = p_message_direction,
    requires_manual_intervention = case 
      when p_needs_manual_review then true 
      else requires_manual_intervention 
    end,
    unread_count = case 
      when p_message_direction = 'inbound' then unread_count + 1 
      else unread_count 
    end,
    updated_at = now()
  where id = p_conversation_id;
end;
$$;

comment on function public.update_conversation_last_message is 'Updates conversation metadata when a new message is processed';

-- Function to get property information for a phone number
create or replace function public.get_property_for_phone_number(
  p_user_id uuid,
  p_whatsapp_account_id bigint,
  p_customer_phone text
)
returns table (
  property_id bigint,
  property_name text,
  auto_respond_enabled boolean,
  property_details json
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  select 
    public.properties.id as property_id,
    public.properties.name as property_name,
    public.phone_number_property_links.auto_respond_enabled,
    json_build_object(
      'address', public.properties.address,
      'wifi_password', public.properties.wifi_password,
      'checkin_time', public.properties.checkin_time,
      'checkout_time', public.properties.checkout_time,
      'house_rules', public.properties.house_rules,
      'emergency_contact', public.properties.emergency_contact,
      'custom_instructions', public.properties.custom_instructions
    )::json as property_details
  from public.phone_number_property_links
  join public.properties on public.properties.id = public.phone_number_property_links.property_id
  where public.phone_number_property_links.customer_phone_number = p_customer_phone
    and public.phone_number_property_links.whatsapp_account_id = p_whatsapp_account_id
    and public.phone_number_property_links.user_id = p_user_id
    and public.phone_number_property_links.unlinked_at is null
    and public.properties.status = 'active';
end;
$$;

comment on function public.get_property_for_phone_number is 'Gets property information and settings for a customer phone number';

-- Function to check if auto-response is enabled for a phone number
create or replace function public.should_auto_respond(
  p_user_id uuid,
  p_whatsapp_account_id bigint,
  p_customer_phone text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  auto_respond boolean := false;
begin
  select public.phone_number_property_links.auto_respond_enabled
  into auto_respond
  from public.phone_number_property_links
  where public.phone_number_property_links.customer_phone_number = p_customer_phone
    and public.phone_number_property_links.whatsapp_account_id = p_whatsapp_account_id
    and public.phone_number_property_links.user_id = p_user_id
    and public.phone_number_property_links.unlinked_at is null;
  
  return coalesce(auto_respond, false);
end;
$$;

comment on function public.should_auto_respond is 'Checks if auto-response is enabled for a customer phone number';

-- Function to mark conversation as needing manual intervention
create or replace function public.mark_conversation_needs_intervention(
  p_conversation_id bigint,
  p_reason text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.conversations
  set 
    requires_manual_intervention = true,
    metadata = jsonb_set(
      coalesce(metadata, '{}'),
      '{intervention_reason}',
      to_jsonb(coalesce(p_reason, 'AI confidence too low'))
    ),
    updated_at = now()
  where id = p_conversation_id;
end;
$$;

comment on function public.mark_conversation_needs_intervention is 'Marks a conversation as requiring manual intervention with optional reason';
