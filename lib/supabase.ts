import { createClient } from "@supabase/supabase-js";

// Supabase client for client-side operations
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Database types for type safety
export interface WhatsAppBusinessAccount {
    id: number;
    user_id: string;
    waba_id: string;
    access_token: string;
    phone_number_id: string;
    display_phone_number: string;
    business_name?: string;
    status: "active" | "inactive" | "suspended";
    webhook_verified: boolean;
    token_expires_at?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Property {
    id: number;
    user_id: string;
    name: string;
    address?: string;
    description?: string;
    wifi_password?: string;
    checkin_time?: string;
    checkout_time?: string;
    house_rules?: string;
    emergency_contact?: string;
    custom_instructions?: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
}

export interface PhoneNumberPropertyLink {
    id: number;
    user_id: string;
    whatsapp_account_id: number;
    property_id: number;
    customer_phone_number: string;
    auto_respond_enabled: boolean;
    linked_at: string;
    unlinked_at?: string;
    created_by_user_id: string;
}

export interface Conversation {
    id: number;
    user_id: string;
    whatsapp_account_id: number;
    property_link_id?: number;
    customer_phone_number: string;
    business_phone_number: string;
    conversation_identifier: string;
    last_message_at?: string;
    last_message_direction?: "inbound" | "outbound";
    unread_count: number;
    requires_manual_intervention: boolean;
    status: "active" | "archived" | "blocked";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    whatsapp_message_id: string;
    direction: "inbound" | "outbound";
    from_phone_number: string;
    to_phone_number: string;
    message_type:
        | "text"
        | "image"
        | "document"
        | "audio"
        | "video"
        | "location"
        | "contacts"
        | "sticker"
        | "reaction"
        | "unknown";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: Record<string, any>;
    message_text?: string;
    status?: "sent" | "delivered" | "read" | "failed";
    error_message?: string;
    is_auto_response: boolean;
    needs_manual_review: boolean;
    ai_confidence_score?: number;
    ai_processing_error?: string;
    contact_name?: string;
    timestamp_whatsapp: string;
    processed_at: string;
    created_at: string;
}
