import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // Check all tables for data
        const [
            { data: accounts, error: accountsError },
            { data: conversations, error: conversationsError },
            { data: messages, error: messagesError },
            { data: properties, error: propertiesError },
            { data: links, error: linksError },
        ] = await Promise.all([
            supabaseAdmin.from("whatsapp_business_accounts").select("*"),
            supabaseAdmin.from("conversations").select("*"),
            supabaseAdmin.from("messages").select("*"),
            supabaseAdmin.from("properties").select("*"),
            supabaseAdmin.from("phone_number_property_links").select("*"),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                whatsapp_business_accounts: {
                    count: accounts?.length || 0,
                    data: accounts || [],
                    error: accountsError?.message,
                },
                conversations: {
                    count: conversations?.length || 0,
                    data: conversations || [],
                    error: conversationsError?.message,
                },
                messages: {
                    count: messages?.length || 0,
                    data: messages || [],
                    error: messagesError?.message,
                },
                properties: {
                    count: properties?.length || 0,
                    data: properties || [],
                    error: propertiesError?.message,
                },
                phone_number_property_links: {
                    count: links?.length || 0,
                    data: links || [],
                    error: linksError?.message,
                },
            },
        });
    } catch (error) {
        console.error("Debug API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
