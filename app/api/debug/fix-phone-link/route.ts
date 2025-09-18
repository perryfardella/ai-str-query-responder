import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
    try {
        const phoneNumber = "61405944562"; // Your phone number from the logs
        const whatsappAccountId = 1; // From the logs

        console.log("Fixing phone link for:", phoneNumber);

        // First, let's see what exists
        const { data: existingLinks, error: checkError } = await supabaseAdmin
            .from("phone_number_property_links")
            .select(`
                *,
                properties (
                    id,
                    name,
                    wifi_password
                )
            `)
            .eq("customer_phone_number", phoneNumber)
            .eq("whatsapp_account_id", whatsappAccountId);

        console.log("Existing links:", existingLinks);

        if (checkError) {
            return NextResponse.json({
                success: false,
                error: "Failed to check existing links",
                details: checkError.message,
            });
        }

        // If there's an existing link, just enable auto-response
        if (existingLinks && existingLinks.length > 0) {
            const { data: updatedLink, error: updateError } =
                await supabaseAdmin
                    .from("phone_number_property_links")
                    .update({
                        auto_respond_enabled: true,
                    })
                    .eq("customer_phone_number", phoneNumber)
                    .eq("whatsapp_account_id", whatsappAccountId)
                    .select();

            if (updateError) {
                return NextResponse.json({
                    success: false,
                    error: "Failed to update existing link",
                    details: updateError.message,
                });
            }

            return NextResponse.json({
                success: true,
                action: "updated_existing_link",
                updated_link: updatedLink,
                message:
                    `Auto-response enabled for existing link: ${phoneNumber}`,
            });
        }

        // If no link exists, create one with the first available property
        const { data: properties, error: propError } = await supabaseAdmin
            .from("properties")
            .select("*")
            .eq("status", "active")
            .limit(1);

        if (propError || !properties || properties.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No properties found to link to",
                details: propError?.message,
            });
        }

        const property = properties[0];

        const { data: newLink, error: linkError } = await supabaseAdmin
            .from("phone_number_property_links")
            .insert({
                user_id: property.user_id,
                whatsapp_account_id: whatsappAccountId,
                property_id: property.id,
                customer_phone_number: phoneNumber,
                auto_respond_enabled: true,
                created_by_user_id: property.user_id,
            })
            .select();

        if (linkError) {
            return NextResponse.json({
                success: false,
                error: "Failed to create new link",
                details: linkError.message,
            });
        }

        return NextResponse.json({
            success: true,
            action: "created_new_link",
            new_link: newLink,
            property: property,
            message:
                `Created new property link for ${phoneNumber} to ${property.name}`,
        });
    } catch (error) {
        console.error("Fix phone link error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
