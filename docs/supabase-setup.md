# Supabase Database Setup Guide

This guide will walk you through setting up the Supabase database schema for the AI STR Query Responder WhatsApp integration.

## Prerequisites

- Supabase account and project created
- Supabase CLI installed (`npm install -g supabase`)
- Environment variables configured

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Setup

### Option 1: Using Supabase CLI (Recommended)

1. **Initialize Supabase in your project:**

   ```bash
   supabase init
   ```

2. **Link to your Supabase project:**

   ```bash
   supabase link --project-ref your-project-reference
   ```

3. **Push the migrations to your database:**
   ```bash
   supabase db push
   ```

### Option 2: Manual Setup via Supabase Dashboard

If you prefer to set up manually, run these SQL commands in your Supabase SQL Editor in order:

1. **Run the main schema migration:**

   - Copy and paste the contents of `supabase/migrations/20241218120000_create_whatsapp_schema.sql`
   - Execute in Supabase SQL Editor

2. **Run the RLS policies migration:**

   - Copy and paste the contents of `supabase/migrations/20241218120001_create_rls_policies.sql`
   - Execute in Supabase SQL Editor

3. **Run the helper functions migration:**
   - Copy and paste the contents of `supabase/migrations/20241218120002_create_helper_functions.sql`
   - Execute in Supabase SQL Editor

## Database Schema Overview

The schema includes the following tables:

### Core Tables

1. **`whatsapp_business_accounts`**

   - Stores WhatsApp Business API account information
   - Links to user accounts via `user_id`
   - Contains access tokens and phone number details

2. **`properties`**

   - Stores short-term rental property information
   - Contains property details like WiFi passwords, check-in times, etc.
   - Used for AI context when generating responses

3. **`phone_number_property_links`**

   - Links customer phone numbers to properties
   - Controls auto-response settings per phone number
   - Supports temporal linking (one active link per phone number)

4. **`conversations`**

   - Groups messages between customer and business phone numbers
   - Tracks conversation status and manual intervention needs
   - Links to properties for context

5. **`messages`**
   - Individual WhatsApp messages (inbound and outbound)
   - Stores full WhatsApp API payloads and processed content
   - Tracks AI processing status and confidence scores

### Key Features

- **Row Level Security (RLS)**: All tables have RLS enabled with user-specific policies
- **Temporal Property Linking**: Phone numbers can be linked to different properties over time
- **Auto-Response Control**: Per-phone-number settings for automated responses
- **Manual Intervention Tracking**: Flags conversations that need human attention
- **Full Message History**: Complete conversation history for AI context

## Testing the Setup

1. **Verify tables are created:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%whatsapp%' OR table_name = 'properties';
   ```

2. **Check RLS policies:**

   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Test helper functions:**
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%conversation%';
   ```

## Next Steps

After setting up the database:

1. **Configure WhatsApp Business Account:**

   - Add your WhatsApp Business account details to the `whatsapp_business_accounts` table
   - This can be done through the UI once you implement the account setup flow

2. **Create Properties:**

   - Add your rental properties to the `properties` table
   - Include all relevant details for AI context

3. **Link Phone Numbers:**

   - Use the `phone_number_property_links` table to associate customer phone numbers with properties
   - Enable/disable auto-response per phone number

4. **Test Webhook Integration:**
   - Send test messages to verify the webhook saves data correctly
   - Check the conversations page to see message history

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries:**

   - Ensure you're authenticated when testing
   - Check that policies are correctly set up
   - Use the service role key for server-side operations

2. **Migration Errors:**

   - Ensure migrations are run in the correct order
   - Check for any existing tables with conflicting names
   - Verify your Supabase project permissions

3. **Function Errors:**
   - Check that all referenced tables exist
   - Verify function permissions and security settings
   - Test functions individually in SQL Editor

### Getting Help

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify your environment variables are correct
3. Test database connections using the Supabase client
4. Check the console logs for detailed error messages

## Security Considerations

- **Service Role Key**: Keep your service role key secure and only use it server-side
- **RLS Policies**: All user data is protected by Row Level Security
- **Token Storage**: WhatsApp access tokens are stored encrypted
- **User Isolation**: Each user can only access their own data

The database is now ready to handle WhatsApp message storage and conversation management!
