import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side operations (with service role key)
// Used for webhooks and system operations that don't have user context
// WARNING: This should ONLY be used in server-side code (API routes, server components)
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    },
);

// Utility function to check if we're running on the server
export const isServer = typeof window === "undefined";

// Safe admin client that only works on the server
export const getSupabaseAdmin = () => {
    if (!isServer) {
        throw new Error("supabaseAdmin can only be used on the server side");
    }
    return supabaseAdmin;
};
