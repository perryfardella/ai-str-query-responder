import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        // Get the WhatsApp account details
        const { data: account, error } = await supabaseAdmin
            .from("whatsapp_business_accounts")
            .select("*")
            .eq("status", "active")
            .single();

        if (error || !account) {
            return NextResponse.json({
                success: false,
                error: "No WhatsApp account found",
                details: error?.message,
            });
        }

        // Test the access token by making a simple API call
        const testResponse = await fetch(
            `https://graph.facebook.com/v18.0/${account.phone_number_id}`,
            {
                headers: {
                    Authorization: `Bearer ${account.access_token}`,
                },
            },
        );

        const testResult = await testResponse.json();

        // Also test permissions by checking the phone number details
        const phoneResponse = await fetch(
            `https://graph.facebook.com/v18.0/${account.phone_number_id}?fields=verified_name,display_phone_number,quality_rating`,
            {
                headers: {
                    Authorization: `Bearer ${account.access_token}`,
                },
            },
        );

        const phoneResult = await phoneResponse.json();

        return NextResponse.json({
            success: true,
            account_info: {
                id: account.id,
                phone_number_id: account.phone_number_id,
                display_phone_number: account.display_phone_number,
                business_name: account.business_name,
                token_expires_at: account.token_expires_at,
                webhook_verified: account.webhook_verified,
            },
            token_test: {
                status: testResponse.status,
                success: testResponse.ok,
                result: testResult,
            },
            phone_test: {
                status: phoneResponse.status,
                success: phoneResponse.ok,
                result: phoneResult,
            },
            token_info: {
                token_length: account.access_token?.length || 0,
                token_preview: account.access_token
                    ? account.access_token.substring(0, 20) + "..."
                    : "No token",
            },
        });
    } catch (error) {
        console.error("Token debug error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
