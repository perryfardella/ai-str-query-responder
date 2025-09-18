import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-response";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const testMessage = searchParams.get("message") ||
            "What is the WiFi password?";

        // Get the first conversation to test with
        const { data: conversations, error: convError } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .limit(1);

        if (convError || !conversations || conversations.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No conversations found",
                details: convError?.message,
            });
        }

        const conversationId = conversations[0].id;

        console.log(
            "Testing AI with conversation:",
            conversationId,
            "message:",
            testMessage,
        );

        // Test AI response generation
        const aiResult = await generateAIResponse(conversationId, testMessage);

        return NextResponse.json({
            success: true,
            test_message: testMessage,
            conversation_id: conversationId,
            ai_result: aiResult,
            environment_check: {
                deepseek_api_key_exists: !!process.env.DEEPSEEK_API_KEY,
                deepseek_api_key_length: process.env.DEEPSEEK_API_KEY?.length ||
                    0,
            },
        });
    } catch (error) {
        console.error("AI test error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
}
