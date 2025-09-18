import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            user_id,
            waba_id,
            phone_number_id,
            display_phone_number,
            access_token,
            business_name,
        } = body;

        // Validate required fields
        if (
            !user_id || !waba_id || !phone_number_id || !display_phone_number ||
            !access_token
        ) {
            return NextResponse.json(
                {
                    error:
                        "Missing required fields: user_id, waba_id, phone_number_id, display_phone_number, access_token",
                },
                { status: 400 },
            );
        }

        // Insert or update WhatsApp Business Account
        const { data, error } = await supabaseAdmin
            .from("whatsapp_business_accounts")
            .upsert(
                {
                    user_id,
                    waba_id,
                    phone_number_id,
                    display_phone_number,
                    access_token,
                    business_name: business_name || null,
                    status: "active",
                    webhook_verified: true,
                    metadata: {},
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "phone_number_id",
                },
            )
            .select()
            .single();

        if (error) {
            console.error("Error creating WhatsApp account:", error);
            return NextResponse.json(
                {
                    error: "Failed to create WhatsApp account",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            account: data,
            message: "WhatsApp Business Account created successfully",
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            {
                error: "Setup failed",
                details: error instanceof Error
                    ? error.message
                    : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// GET endpoint to check existing accounts
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("whatsapp_business_accounts")
            .select("*")
            .eq("status", "active");

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch accounts", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            accounts: data,
            count: data.length,
        });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch accounts" },
            { status: 500 },
        );
    }
}
