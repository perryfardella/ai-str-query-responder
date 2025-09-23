-- Migration: Enable realtime on tables for postgres_changes subscriptions
-- Purpose: Enable real-time updates for the conversations interface
-- Affected tables: messages, conversations

-- Enable realtime on the messages table
-- This allows postgres_changes subscriptions to work
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER publication supabase_realtime ADD TABLE public.conversations;

-- Create indexes to support efficient realtime queries
CREATE INDEX IF NOT EXISTS idx_conversations_id_user_id ON public.conversations(id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp ON public.messages(conversation_id, timestamp_whatsapp);

-- Comment on the changes
COMMENT ON TABLE public.messages IS 'Messages table with realtime enabled for instant message updates';
COMMENT ON TABLE public.conversations IS 'Conversations table with realtime enabled for conversation list updates';
