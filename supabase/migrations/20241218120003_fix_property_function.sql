-- Fix database function type mismatch
drop function if exists public.get_property_for_phone_number;

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
