import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    processWhatsAppMessage,
    saveMessage,
    updateConversationLastMessage,
} from "@/lib/whatsapp-db";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        const { message } = await request.json();

        if (isNaN(conversationId)) {
            return NextResponse.json(
                { error: "Invalid conversation ID" },
                { status: 400 },
            );
        }

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { error: "Message content is required" },
                { status: 400 },
            );
        }

        // Get conversation details
        const { data: conversation, error: convError } = await supabaseAdmin
            .from("conversations")
            .select(
                `
                *,
                whatsapp_business_accounts (
                    access_token,
                    phone_number_id,
                    display_phone_number
                )
            `,
            )
            .eq("id", conversationId)
            .single();

        if (convError || !conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 },
            );
        }

        const whatsappAccount = conversation.whatsapp_business_accounts;
        if (!whatsappAccount) {
            return NextResponse.json(
                { error: "WhatsApp account not found for this conversation" },
                { status: 404 },
            );
        }

        // Send message via WhatsApp Business API
        const whatsappResponse = await fetch(
            `https://graph.facebook.com/v18.0/${whatsappAccount.phone_number_id}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${whatsappAccount.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: conversation.customer_phone_number,
                    type: "text",
                    text: { body: message.trim() },
                }),
            },
        );

        const whatsappResult = await whatsappResponse.json();

        if (!whatsappResponse.ok) {
            console.error("WhatsApp API error:", whatsappResult);

            // Check if it's a token expiration error
            if (whatsappResult.error?.code === 190) {
                return NextResponse.json(
                    {
                        error: "WhatsApp access token has expired",
                        details:
                            "Please update your access token in the setup page",
                        error_code: 190,
                        token_expired: true,
                    },
                    { status: 401 },
                );
            }

            return NextResponse.json(
                {
                    error: "Failed to send message via WhatsApp",
                    details: whatsappResult.error?.message || "Unknown error",
                    error_code: whatsappResult.error?.code,
                },
                { status: 500 },
            );
        }

        // Create message data structure similar to incoming messages
        const messageData = {
            whatsapp_message_id: whatsappResult.messages[0].id,
            direction: "outbound" as const,
            from_phone_number: whatsappAccount.display_phone_number,
            to_phone_number: conversation.customer_phone_number,
            message_type: "text",
            content: {
                text: { body: message.trim() },
                type: "text",
            },
            message_text: message.trim(),
            timestamp_whatsapp: new Date().toISOString(),
        };

        // Save the sent message to database
        const savedMessage = await saveMessage(
            conversationId,
            messageData,
            false, // is_auto_response
            false, // needs_manual_review
            undefined, // ai_confidence_score
            undefined, // ai_processing_error
        );

        if (!savedMessage) {
            return NextResponse.json(
                { error: "Message sent but failed to save to database" },
                { status: 500 },
            );
        }

        // Update conversation metadata
        await updateConversationLastMessage(
            conversationId,
            "outbound",
            messageData.timestamp_whatsapp,
            false,
        );

        return NextResponse.json({
            success: true,
            message: "Message sent successfully",
            whatsapp_message_id: whatsappResult.messages[0].id,
            saved_message: savedMessage,
        });
    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json(
            {
                error: "Failed to send message",
                details: error instanceof Error
                    ? error.message
                    : "Unknown error",
            },
            { status: 500 },
        );
    }
}
