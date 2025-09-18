import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import {
    formatPropertyContextForAI,
    getPropertyContext,
} from "./property-context";
import { supabaseAdmin } from "./supabase-admin";
import type { Message } from "./supabase";

export interface AIResponseResult {
    response: string;
    confidence: number;
    shouldSend: boolean;
    reasoning?: string;
    error?: string;
}

/**
 * Generate AI response for a WhatsApp message
 */
export async function generateAIResponse(
    conversationId: number,
    incomingMessage: string,
    propertyId?: number,
): Promise<AIResponseResult> {
    try {
        // Get conversation history
        const conversationHistory = await getConversationHistory(
            conversationId,
        );

        // Get property context
        const propertyContext = getPropertyContext(propertyId);
        const formattedPropertyInfo = formatPropertyContextForAI(
            propertyContext,
        );

        // Build conversation context for AI
        const conversationContext = buildConversationContext(
            conversationHistory,
        );

        // Generate AI response
        const { text } = await generateText({
            model: deepseek("deepseek-chat"),
            messages: [
                {
                    role: "system",
                    content: buildSystemPrompt(formattedPropertyInfo),
                },
                ...conversationContext,
                {
                    role: "user",
                    content: incomingMessage,
                },
            ],
            temperature: 0.1, // Low temperature for consistent, factual responses
        });

        // Analyze confidence and determine if we should send
        const analysis = analyzeResponseConfidence(text, incomingMessage);

        return {
            response: text,
            confidence: analysis.confidence,
            shouldSend: analysis.shouldSend,
            reasoning: analysis.reasoning,
        };
    } catch (error) {
        console.error("AI response generation error:", error);
        return {
            response: "",
            confidence: 0,
            shouldSend: false,
            error: error instanceof Error ? error.message : "Unknown AI error",
        };
    }
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(
    conversationId: number,
): Promise<Message[]> {
    const { data: messages, error } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("timestamp_whatsapp", { ascending: true })
        .limit(20); // Get last 20 messages for context

    if (error) {
        console.error("Error fetching conversation history:", error);
        return [];
    }

    return messages || [];
}

/**
 * Build conversation context for AI
 */
function buildConversationContext(messages: Message[]): Array<{
    role: "user" | "assistant";
    content: string;
}> {
    return messages.map((message) => ({
        role: message.direction === "inbound"
            ? ("user" as const)
            : ("assistant" as const),
        content: message.message_text || `[${message.message_type} message]`,
    }));
}

/**
 * Build system prompt with property information
 */
function buildSystemPrompt(propertyInfo: string): string {
    return `You are an AI assistant for a short-term rental (Airbnb) property. Your job is to help guests with their questions about the property, local area, and their stay.

${propertyInfo}

INSTRUCTIONS:
- Be helpful, friendly, and professional
- Only answer questions you're confident about based on the property information provided
- If you're not sure about something, say "Let me check with the host and get back to you"
- Keep responses concise but informative
- Use a warm, welcoming tone
- For emergencies, always direct guests to call 911 or the emergency contact
- Don't make up information not provided in the property details

CONFIDENCE GUIDELINES:
- High confidence (95%+): Questions directly answered by the property information
- Medium confidence (70-94%): General hospitality questions you can reasonably answer
- Low confidence (<70%): Specific questions not covered in property info, complex issues, or anything you're unsure about

RESPONSE FORMAT:
Provide a helpful response to the guest's question. Be natural and conversational.`;
}

/**
 * Analyze response confidence and determine if we should auto-send
 */
function analyzeResponseConfidence(response: string, originalMessage: string): {
    confidence: number;
    shouldSend: boolean;
    reasoning: string;
} {
    // Simple confidence analysis - in production, you might use more sophisticated methods
    const lowConfidenceIndicators = [
        "let me check",
        "i'm not sure",
        "i don't know",
        "not certain",
        "need to verify",
        "check with the host",
        "contact the host",
    ];

    const highConfidenceIndicators = [
        "wifi password",
        "check-in time",
        "check-out time",
        "trash day",
        "parking",
        "nearby restaurant",
        "address",
        "amenities",
    ];

    const responseLower = response.toLowerCase();
    const messageLower = originalMessage.toLowerCase();

    // Check for low confidence indicators
    const hasLowConfidenceWords = lowConfidenceIndicators.some((indicator) =>
        responseLower.includes(indicator)
    );

    if (hasLowConfidenceWords) {
        return {
            confidence: 0.3,
            shouldSend: false,
            reasoning: "Response contains uncertainty indicators",
        };
    }

    // Check for high confidence topics
    const hasHighConfidenceTopics = highConfidenceIndicators.some((topic) =>
        messageLower.includes(topic)
    );

    if (hasHighConfidenceTopics) {
        return {
            confidence: 0.98,
            shouldSend: true,
            reasoning: "Question about well-documented property information",
        };
    }

    // Default to medium confidence for general questions
    if (response.length > 20 && response.length < 300) {
        return {
            confidence: 0.85,
            shouldSend: false, // Conservative approach - require manual review for medium confidence
            reasoning: "General response, requires manual review",
        };
    }

    // Very short or very long responses are suspicious
    return {
        confidence: 0.5,
        shouldSend: false,
        reasoning: "Response length suggests uncertainty",
    };
}

/**
 * Format conversation history for display/debugging
 */
export function formatConversationForDisplay(messages: Message[]): string {
    return messages.map((msg) =>
        `${msg.direction === "inbound" ? "Guest" : "Host"}: ${
            msg.message_text || `[${msg.message_type}]`
        }`
    ).join("\n");
}
