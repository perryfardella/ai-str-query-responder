import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        const { customer_phone_number, whatsapp_account_id } = await request
            .json();

        if (!customer_phone_number || !whatsapp_account_id) {
            return NextResponse.json(
                {
                    error:
                        "Missing required fields: customer_phone_number, whatsapp_account_id",
                },
                { status: 400 },
            );
        }

        // Update existing link to enable auto-response
        const { data, error } = await supabaseAdmin
            .from("phone_number_property_links")
            .update({
                auto_respond_enabled: true,
                updated_at: new Date().toISOString(),
            })
            .eq("customer_phone_number", customer_phone_number)
            .eq("whatsapp_account_id", whatsapp_account_id)
            .is("unlinked_at", null)
            .select();

        if (error) {
            console.error("Error enabling auto-response:", error);
            return NextResponse.json(
                {
                    error: "Failed to enable auto-response",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "No property link found for this phone number" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            updated_links: data,
            message: `Auto-response enabled for ${customer_phone_number}`,
        });
    } catch (error) {
        console.error("Enable auto-response error:", error);
        return NextResponse.json(
            {
                error: "Failed to enable auto-response",
                details: error instanceof Error
                    ? error.message
                    : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// GET endpoint to check auto-response status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneNumber = searchParams.get("phone");
        const whatsappAccountId = searchParams.get("account_id");

        if (!phoneNumber || !whatsappAccountId) {
            return NextResponse.json(
                { error: "Missing query parameters: phone, account_id" },
                { status: 400 },
            );
        }

        const { data, error } = await supabaseAdmin
            .from("phone_number_property_links")
            .select(`
                *,
                properties (
                    name,
                    address
                )
            `)
            .eq("customer_phone_number", phoneNumber)
            .eq("whatsapp_account_id", parseInt(whatsappAccountId))
            .is("unlinked_at", null)
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to check status", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            phone_number: phoneNumber,
            auto_respond_enabled: data?.auto_respond_enabled || false,
            property_name: data?.properties?.name,
            link_exists: !!data,
        });
    } catch (error) {
        console.error("Check status error:", error);
        return NextResponse.json(
            { error: "Failed to check auto-response status" },
            { status: 500 },
        );
    }
}
