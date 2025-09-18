import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        const {
            user_id,
            whatsapp_account_id,
            customer_phone_number,
            property_name,
            auto_respond_enabled = true,
        } = await request.json();

        if (
            !user_id || !whatsapp_account_id || !customer_phone_number ||
            !property_name
        ) {
            return NextResponse.json(
                {
                    error:
                        "Missing required fields: user_id, whatsapp_account_id, customer_phone_number, property_name",
                },
                { status: 400 },
            );
        }

        // Create property first
        const { data: property, error: propertyError } = await supabaseAdmin
            .from("properties")
            .insert({
                user_id,
                name: property_name,
                address: "123 Main Street, Downtown, San Francisco, CA 94102", // Using fictional address
                description:
                    "A beautiful 2-bedroom loft in the heart of downtown with stunning city views and modern amenities.",
                wifi_password: "Welcome2024!",
                checkin_time: "15:00:00",
                checkout_time: "11:00:00",
                house_rules:
                    "No smoking, no parties after 10 PM, maximum 4 guests, no pets",
                emergency_contact: "Sarah Johnson: +1 (555) 123-4567",
                custom_instructions:
                    "Key in lockbox by front door (code: 1234). Parking space #12 in garage (code: 5678).",
                status: "active",
            })
            .select()
            .single();

        if (propertyError) {
            console.error("Error creating property:", propertyError);
            return NextResponse.json(
                {
                    error: "Failed to create property",
                    details: propertyError.message,
                },
                { status: 500 },
            );
        }

        // Link phone number to property
        const { data: link, error: linkError } = await supabaseAdmin
            .from("phone_number_property_links")
            .insert({
                user_id,
                whatsapp_account_id,
                property_id: property.id,
                customer_phone_number,
                auto_respond_enabled,
                created_by_user_id: user_id,
            })
            .select()
            .single();

        if (linkError) {
            console.error("Error creating property link:", linkError);
            return NextResponse.json(
                {
                    error: "Failed to create property link",
                    details: linkError.message,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            property,
            link,
            message:
                `Phone number ${customer_phone_number} linked to property "${property_name}" with auto-response ${
                    auto_respond_enabled ? "enabled" : "disabled"
                }`,
        });
    } catch (error) {
        console.error("Property link setup error:", error);
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

// GET endpoint to view existing links
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("phone_number_property_links")
            .select(`
                *,
                properties (
                    name,
                    address
                ),
                whatsapp_business_accounts (
                    display_phone_number
                )
            `)
            .is("unlinked_at", null); // Only active links

        if (error) {
            return NextResponse.json(
                {
                    error: "Failed to fetch property links",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            links: data,
            count: data.length,
        });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch property links" },
            { status: 500 },
        );
    }
}
