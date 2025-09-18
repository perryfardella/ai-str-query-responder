import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-response";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        const { message, propertyId } = await request.json();

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

        // Generate AI response
        const aiResult = await generateAIResponse(
            conversationId,
            message.trim(),
            propertyId,
        );

        if (aiResult.error) {
            return NextResponse.json(
                {
                    error: "AI processing failed",
                    details: aiResult.error,
                },
                { status: 500 },
            );
        }

        // Return AI response with confidence analysis
        return NextResponse.json({
            success: true,
            ai_response: aiResult.response,
            confidence: aiResult.confidence,
            should_send: aiResult.shouldSend,
            reasoning: aiResult.reasoning,
            message: aiResult.shouldSend
                ? "AI response generated - confidence high enough to send"
                : "AI response generated - manual review required",
        });
    } catch (error) {
        console.error("AI response error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate AI response",
                details: error instanceof Error
                    ? error.message
                    : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// GET endpoint to test AI responses
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);
        const { searchParams } = new URL(request.url);
        const testMessage = searchParams.get("message") ||
            "What is the WiFi password?";

        if (isNaN(conversationId)) {
            return NextResponse.json(
                { error: "Invalid conversation ID" },
                { status: 400 },
            );
        }

        // Generate test AI response
        const aiResult = await generateAIResponse(conversationId, testMessage);

        return NextResponse.json({
            success: true,
            test_message: testMessage,
            ai_result: aiResult,
            conversation_id: conversationId,
        });
    } catch (error) {
        console.error("AI test error:", error);
        return NextResponse.json(
            {
                error: "Failed to test AI response",
                details: error instanceof Error
                    ? error.message
                    : "Unknown error",
            },
            { status: 500 },
        );
    }
}
