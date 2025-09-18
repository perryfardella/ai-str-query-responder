import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // Fetch all conversations (bypassing RLS for development)
        const { data: conversations, error } = await supabaseAdmin
            .from("conversations")
            .select(`
        *,
        phone_number_property_links (
          properties (
            name
          )
        )
      `)
            .order("last_message_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching conversations:", error);
            return NextResponse.json(
                {
                    error: "Failed to fetch conversations",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        // Format the data to include property names
        const conversationsWithPropertyNames = conversations.map((conv) => ({
            ...conv,
            property_name: conv.phone_number_property_links?.properties?.name,
        }));

        return NextResponse.json({
            success: true,
            conversations: conversationsWithPropertyNames,
            count: conversationsWithPropertyNames.length,
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 },
        );
    }
}
