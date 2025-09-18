-- Migration: Create Row Level Security policies for WhatsApp schema
-- Purpose: Implement secure access control for all WhatsApp-related tables
-- Security: Users can only access their own data, policies are granular per operation

-- RLS Policies for whatsapp_business_accounts table

create policy "Users can view their own WhatsApp accounts"
on public.whatsapp_business_accounts
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own WhatsApp accounts"
on public.whatsapp_business_accounts
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own WhatsApp accounts"
on public.whatsapp_business_accounts
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own WhatsApp accounts"
on public.whatsapp_business_accounts
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- RLS Policies for properties table

create policy "Users can view their own properties"
on public.properties
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own properties"
on public.properties
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own properties"
on public.properties
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own properties"
on public.properties
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- RLS Policies for phone_number_property_links table

create policy "Users can view their own phone number links"
on public.phone_number_property_links
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own phone number links"
on public.phone_number_property_links
for insert
to authenticated
with check ( 
  (select auth.uid()) = user_id 
  and (select auth.uid()) = created_by_user_id 
);

create policy "Users can update their own phone number links"
on public.phone_number_property_links
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own phone number links"
on public.phone_number_property_links
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- RLS Policies for conversations table

create policy "Users can view their own conversations"
on public.conversations
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own conversations"
on public.conversations
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own conversations"
on public.conversations
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own conversations"
on public.conversations
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- RLS Policies for messages table
-- Note: Messages are accessed through conversations, so we check conversation ownership

create policy "Users can view messages from their conversations"
on public.messages
for select
to authenticated
using ( 
  conversation_id in (
    select public.conversations.id 
    from public.conversations 
    where public.conversations.user_id = (select auth.uid())
  )
);

create policy "Users can insert messages to their conversations"
on public.messages
for insert
to authenticated
with check ( 
  conversation_id in (
    select public.conversations.id 
    from public.conversations 
    where public.conversations.user_id = (select auth.uid())
  )
);

create policy "Users can update messages in their conversations"
on public.messages
for update
to authenticated
using ( 
  conversation_id in (
    select public.conversations.id 
    from public.conversations 
    where public.conversations.user_id = (select auth.uid())
  )
)
with check ( 
  conversation_id in (
    select public.conversations.id 
    from public.conversations 
    where public.conversations.user_id = (select auth.uid())
  )
);

create policy "Users can delete messages from their conversations"
on public.messages
for delete
to authenticated
using ( 
  conversation_id in (
    select public.conversations.id 
    from public.conversations 
    where public.conversations.user_id = (select auth.uid())
  )
);
