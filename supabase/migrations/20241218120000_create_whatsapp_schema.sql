-- Migration: Create WhatsApp Business messaging schema
-- Purpose: Set up tables for WhatsApp Business API integration with conversation tracking
-- Affected tables: whatsapp_business_accounts, properties, phone_number_property_links, conversations, messages
-- Special considerations: Full RLS enabled, supports multiple properties per phone number

-- Create whatsapp_business_accounts table
create table public.whatsapp_business_accounts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  waba_id text unique not null,
  access_token text not null,
  phone_number_id text not null,
  display_phone_number text not null,
  business_name text,
  status text default 'active' check (status in ('active', 'inactive', 'suspended')),
  webhook_verified boolean default false,
  token_expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.whatsapp_business_accounts is 'WhatsApp Business API accounts linked to users for message automation';

-- Create properties table
create table public.properties (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  description text,
  wifi_password text,
  checkin_time time,
  checkout_time time,
  house_rules text,
  emergency_contact text,
  custom_instructions text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.properties is 'Short-term rental properties that can be linked to WhatsApp conversations';

-- Create phone_number_property_links table
create table public.phone_number_property_links (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  whatsapp_account_id bigint references public.whatsapp_business_accounts(id) on delete cascade not null,
  property_id bigint references public.properties(id) on delete cascade not null,
  customer_phone_number text not null,
  auto_respond_enabled boolean default true not null,
  linked_at timestamptz default now() not null,
  unlinked_at timestamptz,
  created_by_user_id uuid references auth.users(id) not null,
  
  -- Note: Unique constraint for active links will be added as a separate index
  constraint unique_phone_whatsapp unique (customer_phone_number, whatsapp_account_id, unlinked_at)
);

comment on table public.phone_number_property_links is 'Links customer phone numbers to properties with auto-response settings. Only one active link per phone number.';

-- Create conversations table
create table public.conversations (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  whatsapp_account_id bigint references public.whatsapp_business_accounts(id) on delete cascade not null,
  property_link_id bigint references public.phone_number_property_links(id) on delete set null,
  customer_phone_number text not null,
  business_phone_number text not null,
  conversation_identifier text not null, -- combination of customer + business numbers
  last_message_at timestamptz,
  last_message_direction text check (last_message_direction in ('inbound', 'outbound')),
  unread_count integer default 0 not null,
  requires_manual_intervention boolean default false not null,
  status text default 'active' check (status in ('active', 'archived', 'blocked')),
  metadata jsonb default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique conversation per customer/business pair
  constraint unique_conversation unique (customer_phone_number, business_phone_number, whatsapp_account_id)
);

comment on table public.conversations is 'WhatsApp conversations between customers and business numbers with intervention tracking';

-- Create messages table
create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint references public.conversations(id) on delete cascade not null,
  whatsapp_message_id text unique not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_phone_number text not null,
  to_phone_number text not null,
  message_type text not null check (message_type in ('text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'sticker', 'reaction', 'unknown')),
  content jsonb not null, -- full whatsapp api payload for the message
  message_text text, -- extracted text content for easy searching
  status text check (status in ('sent', 'delivered', 'read', 'failed')),
  error_message text,
  is_auto_response boolean default false not null,
  needs_manual_review boolean default false not null,
  ai_confidence_score decimal(3,2), -- 0.00 to 1.00
  ai_processing_error text,
  contact_name text, -- sender's profile name from whatsapp
  timestamp_whatsapp timestamptz not null, -- timestamp from whatsapp api
  processed_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

comment on table public.messages is 'Individual WhatsApp messages with full API payload and AI processing metadata';

-- Create indexes for performance
create index idx_whatsapp_accounts_user_id on public.whatsapp_business_accounts(user_id);
create index idx_whatsapp_accounts_waba_id on public.whatsapp_business_accounts(waba_id);
create index idx_whatsapp_accounts_phone_number_id on public.whatsapp_business_accounts(phone_number_id);

create index idx_properties_user_id on public.properties(user_id);
create index idx_properties_status on public.properties(status) where status = 'active';

create index idx_phone_links_user_id on public.phone_number_property_links(user_id);
create index idx_phone_links_customer_phone on public.phone_number_property_links(customer_phone_number);
create index idx_phone_links_whatsapp_account on public.phone_number_property_links(whatsapp_account_id);
-- Partial unique index to ensure only one active link per phone number
create unique index idx_phone_links_active_unique on public.phone_number_property_links(customer_phone_number, whatsapp_account_id) where unlinked_at is null;
create index idx_phone_links_active on public.phone_number_property_links(customer_phone_number, whatsapp_account_id) where unlinked_at is null;

create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_whatsapp_account on public.conversations(whatsapp_account_id);
create index idx_conversations_customer_phone on public.conversations(customer_phone_number);
create index idx_conversations_last_message on public.conversations(last_message_at desc);
create index idx_conversations_needs_intervention on public.conversations(requires_manual_intervention) where requires_manual_intervention = true;

create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_whatsapp_id on public.messages(whatsapp_message_id);
create index idx_messages_direction on public.messages(direction);
create index idx_messages_timestamp on public.messages(timestamp_whatsapp desc);
create index idx_messages_needs_review on public.messages(needs_manual_review) where needs_manual_review = true;
create index idx_messages_auto_response on public.messages(is_auto_response);
create index idx_messages_text_search on public.messages using gin(to_tsvector('english', message_text)) where message_text is not null;

-- Enable Row Level Security on all tables
alter table public.whatsapp_business_accounts enable row level security;
alter table public.properties enable row level security;
alter table public.phone_number_property_links enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger update_whatsapp_accounts_updated_at
  before update on public.whatsapp_business_accounts
  for each row execute function public.update_updated_at_column();

create trigger update_properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at_column();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at_column();
