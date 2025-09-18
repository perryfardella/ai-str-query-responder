import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const resolvedParams = await params;
        const conversationId = parseInt(resolvedParams.id);

        if (isNaN(conversationId)) {
            return NextResponse.json(
                { error: "Invalid conversation ID" },
                { status: 400 },
            );
        }

        // Fetch messages for the conversation
        const { data: messages, error } = await supabaseAdmin
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("timestamp_whatsapp", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return NextResponse.json(
                { error: "Failed to fetch messages", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            messages: messages || [],
            count: messages?.length || 0,
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 },
        );
    }
}
