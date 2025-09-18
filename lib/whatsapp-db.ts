import { supabaseAdmin } from "./supabase-admin";
import type { Message, WhatsAppBusinessAccount } from "./supabase";

// Helper functions for WhatsApp database operations

export interface WhatsAppMessageData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages?: any[];
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contacts?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statuses?: any[];
}

export interface ProcessedMessage {
    whatsapp_message_id: string;
    direction: "inbound" | "outbound";
    from_phone_number: string;
    to_phone_number: string;
    message_type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any;
    message_text?: string;
    contact_name?: string;
    timestamp_whatsapp: string;
}

/**
 * Find WhatsApp Business Account by phone number ID
 */
export async function findWhatsAppAccount(
    phoneNumberId: string,
): Promise<WhatsAppBusinessAccount | null> {
    const { data, error } = await supabaseAdmin
        .from("whatsapp_business_accounts")
        .select("*")
        .eq("phone_number_id", phoneNumberId)
        .eq("status", "active")
        .single();

    if (error) {
        console.error("Error finding WhatsApp account:", error);
        return null;
    }

    return data;
}

/**
 * Get or create a conversation between two phone numbers
 */
export async function getOrCreateConversation(
    userId: string,
    whatsappAccountId: number,
    customerPhone: string,
    businessPhone: string,
): Promise<number | null> {
    const { data, error } = await supabaseAdmin.rpc(
        "get_or_create_conversation",
        {
            p_user_id: userId,
            p_whatsapp_account_id: whatsappAccountId,
            p_customer_phone: customerPhone,
            p_business_phone: businessPhone,
        },
    );

    if (error) {
        console.error("Error getting/creating conversation:", error);
        return null;
    }

    return data;
}

/**
 * Save a message to the database
 */
export async function saveMessage(
    conversationId: number,
    messageData: ProcessedMessage,
    isAutoResponse: boolean = false,
    needsManualReview: boolean = false,
    aiConfidenceScore?: number,
    aiProcessingError?: string,
): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
        .from("messages")
        .insert({
            conversation_id: conversationId,
            whatsapp_message_id: messageData.whatsapp_message_id,
            direction: messageData.direction,
            from_phone_number: messageData.from_phone_number,
            to_phone_number: messageData.to_phone_number,
            message_type: messageData.message_type,
            content: messageData.content,
            message_text: messageData.message_text,
            is_auto_response: isAutoResponse,
            needs_manual_review: needsManualReview,
            ai_confidence_score: aiConfidenceScore,
            ai_processing_error: aiProcessingError,
            contact_name: messageData.contact_name,
            timestamp_whatsapp: messageData.timestamp_whatsapp,
            processed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error("Error saving message:", error);
        return null;
    }

    return data;
}

/**
 * Update conversation metadata after processing a message
 */
export async function updateConversationLastMessage(
    conversationId: number,
    direction: "inbound" | "outbound",
    timestamp: string,
    needsManualReview: boolean = false,
): Promise<void> {
    const { error } = await supabaseAdmin.rpc(
        "update_conversation_last_message",
        {
            p_conversation_id: conversationId,
            p_message_direction: direction,
            p_message_timestamp: timestamp,
            p_needs_manual_review: needsManualReview,
        },
    );

    if (error) {
        console.error("Error updating conversation:", error);
    }
}

/**
 * Get property information for a phone number
 */
export async function getPropertyForPhoneNumber(
    userId: string,
    whatsappAccountId: number,
    customerPhone: string,
): Promise<
    {
        property_id: number;
        property_name: string;
        auto_respond_enabled: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        property_details: any;
    } | null
> {
    const { data, error } = await supabaseAdmin.rpc(
        "get_property_for_phone_number",
        {
            p_user_id: userId,
            p_whatsapp_account_id: whatsappAccountId,
            p_customer_phone: customerPhone,
        },
    );

    if (error) {
        console.error("Error getting property for phone number:", error);
        return null;
    }

    return data?.[0] || null;
}

/**
 * Check if auto-response is enabled for a phone number
 */
export async function shouldAutoRespond(
    userId: string,
    whatsappAccountId: number,
    customerPhone: string,
): Promise<boolean> {
    const { data, error } = await supabaseAdmin.rpc("should_auto_respond", {
        p_user_id: userId,
        p_whatsapp_account_id: whatsappAccountId,
        p_customer_phone: customerPhone,
    });

    if (error) {
        console.error("Error checking auto-respond status:", error);
        return false;
    }

    return data || false;
}

/**
 * Mark conversation as needing manual intervention
 */
export async function markConversationNeedsIntervention(
    conversationId: number,
    reason?: string,
): Promise<void> {
    const { error } = await supabaseAdmin.rpc(
        "mark_conversation_needs_intervention",
        {
            p_conversation_id: conversationId,
            p_reason: reason,
        },
    );

    if (error) {
        console.error("Error marking conversation for intervention:", error);
    }
}

/**
 * Process WhatsApp webhook message data and extract relevant information
 */
export function processWhatsAppMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contacts?: any[],
): ProcessedMessage {
    // Extract text content
    let messageText: string | undefined;
    if (message.type === "text" && message.text?.body) {
        messageText = message.text.body;
    }

    // Find contact info
    const contact = contacts?.find((c) => c.wa_id === message.from);
    const contactName = contact?.profile?.name;

    // Convert timestamp (WhatsApp sends Unix timestamp as string)
    const timestamp = new Date(parseInt(message.timestamp) * 1000)
        .toISOString();

    return {
        whatsapp_message_id: message.id,
        direction: "inbound",
        from_phone_number: message.from,
        to_phone_number: metadata.phone_number_id,
        message_type: message.type || "unknown",
        content: message,
        message_text: messageText,
        contact_name: contactName,
        timestamp_whatsapp: timestamp,
    };
}

/**
 * Update message status (for delivery receipts, read receipts, etc.)
 */
export async function updateMessageStatus(
    whatsappMessageId: string,
    status: "sent" | "delivered" | "read" | "failed",
    errorMessage?: string,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from("messages")
        .update({
            status,
            error_message: errorMessage,
        })
        .eq("whatsapp_message_id", whatsappMessageId);

    if (error) {
        console.error("Error updating message status:", error);
    }
}
