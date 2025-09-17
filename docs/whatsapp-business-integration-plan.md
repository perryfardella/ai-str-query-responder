# WhatsApp Business API Integration Plan

## Meta Embedded Sign Up Flow Implementation for AI STR Query Responder

---

## Overview

This document outlines the complete implementation plan for integrating Meta's WhatsApp Business API embedded sign up flow into the AI STR Query Responder application. The implementation will enable users to authenticate with their WhatsApp Business accounts, receive guest messages via webhooks, and send automated responses through the API.

---

## Phase 1: Meta Developer Setup & Prerequisites

### 1.1 Meta Business Manager Configuration

**Required Actions:**

- [ X ] Create/verify Meta Business Manager account
- [ ] Complete tech partner verification

**Technical Requirements:**

- Business Manager account with admin permissions
- Valid business documentation for verification
- Credit card or payment method for line of credit

### 1.2 Meta App Creation & Configuration

**Required Actions:**

- [ X ] Create new Meta App (Business type) in [Meta App Dashboard](https://developers.facebook.com/apps/)
- [ X ] Add WhatsApp Business Platform to the app
- [ ] Configure app domains (add your production and development domains)
- [ ] Set up App Review submission for required permissions

**App Permissions Required:**

- `whatsapp_business_management` - Manage WABA settings and templates
- `whatsapp_business_messaging` - Send/receive messages
- `business_management` - Manage business assets

**Configuration Details:**

```javascript
// App configuration for Next.js environment
const META_APP_CONFIG = {
  appId: process.env.NEXT_PUBLIC_META_APP_ID,
  version: "v18.0", // Latest stable version
  domains: [
    "your-domain.com",
    "localhost:3000", // For development
  ],
};
```

---

## Phase 2: Next.js Frontend Integration

### 2.1 Facebook JavaScript SDK Setup

**Install Dependencies:**

```bash
pnpm add react-facebook-login
```

**SDK Integration:**

```typescript
// lib/facebook-sdk.ts
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export const initializeFacebookSDK = () => {
  window.fbAsyncInit = function () {
    window.FB.init({
      appId: process.env.NEXT_PUBLIC_META_APP_ID,
      cookie: true,
      xfbml: true,
      version: "v18.0",
    });
  };

  // Load the SDK asynchronously
  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode!.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};
```

### 2.2 Embedded Signup Component

**Create Signup Component:**

```typescript
// components/WhatsAppSignup.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SignupResponse {
  access_token: string;
  expires_in: number;
  signed_request: string;
}

export default function WhatsAppSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmbeddedSignup = async () => {
    setIsLoading(true);

    try {
      window.FB.login(
        (response: any) => {
          if (response.authResponse && response.authResponse.code) {
            // Exchange code for business system user token
            handleAuthCode(response.authResponse.code);
          } else {
            console.error("User cancelled login or did not fully authorize.");
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID, // From Meta App settings
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            version: 2,
          },
        }
      );
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCode = async (code: string) => {
    try {
      const response = await fetch("/api/auth/whatsapp/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push("/dashboard?onboarding=whatsapp");
      }
    } catch (error) {
      console.error("Token exchange failed:", error);
    }
  };

  return (
    <Button
      onClick={handleEmbeddedSignup}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? "Connecting..." : "Connect WhatsApp Business"}
    </Button>
  );
}
```

---

## Phase 3: Backend API Integration

### 3.1 Token Exchange API Route

**Create Token Exchange Endpoint:**

```typescript
// app/api/auth/whatsapp/exchange-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${GRAPH_API_BASE}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || "Token exchange failed");
    }

    // Get WABA information
    const wabaResponse = await fetch(
      `${GRAPH_API_BASE}/me/client_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const wabaData = await wabaResponse.json();

    // Store WhatsApp Business data in Supabase
    const { error: insertError } = await supabase
      .from("whatsapp_business_accounts")
      .upsert({
        user_id: user.id,
        waba_id: wabaData.data[0]?.id,
        access_token: tokenData.access_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
        account_data: wabaData.data[0],
        status: "active",
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      waba_id: wabaData.data[0]?.id,
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      {
        error: "Failed to exchange token",
      },
      { status: 500 }
    );
  }
}
```

### 3.2 Phone Number Registration

**Create Phone Number Management:**

```typescript
// app/api/whatsapp/register-phone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { phone_number, display_name } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get user's WABA data
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: wabaData } = await supabase
      .from("whatsapp_business_accounts")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (!wabaData) {
      return NextResponse.json(
        { error: "No WhatsApp Business Account found" },
        { status: 404 }
      );
    }

    // Register phone number with WhatsApp Business API
    const registerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${wabaData.waba_id}/phone_numbers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wabaData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verified_name: display_name,
          code_method: "SMS",
          phone_number: phone_number,
        }),
      }
    );

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      // Store phone number in database
      await supabase.from("whatsapp_phone_numbers").insert({
        user_id: user?.id,
        waba_id: wabaData.waba_id,
        phone_number_id: registerData.id,
        phone_number: phone_number,
        display_name: display_name,
        status: "pending_verification",
      });
    }

    return NextResponse.json(registerData);
  } catch (error) {
    console.error("Phone registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
```

---

## Phase 4: Database Schema Design

### 4.1 Supabase Tables

**WhatsApp Business Accounts Table:**

```sql
-- Create WhatsApp Business Accounts table
CREATE TABLE whatsapp_business_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id VARCHAR(50) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_data JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX idx_waba_user_id ON whatsapp_business_accounts(user_id);

-- Enable RLS
ALTER TABLE whatsapp_business_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can only access their own WABA data" ON whatsapp_business_accounts
  FOR ALL USING (auth.uid() = user_id);
```

**Phone Numbers Table:**

```sql
-- Create WhatsApp Phone Numbers table
CREATE TABLE whatsapp_phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id VARCHAR(50) REFERENCES whatsapp_business_accounts(waba_id),
  phone_number_id VARCHAR(50) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending_verification',
  verification_code VARCHAR(10),
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_phone_user_id ON whatsapp_phone_numbers(user_id);
CREATE INDEX idx_phone_number_id ON whatsapp_phone_numbers(phone_number_id);

-- Enable RLS
ALTER TABLE whatsapp_phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can only access their own phone numbers" ON whatsapp_phone_numbers
  FOR ALL USING (auth.uid() = user_id);
```

**Messages Table:**

```sql
-- Create Messages table for storing WhatsApp conversations
CREATE TABLE whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES whatsapp_phone_numbers(id),
  property_id UUID REFERENCES properties(id),
  message_id VARCHAR(100) UNIQUE NOT NULL,
  conversation_id VARCHAR(100),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- text, image, document, etc.
  content JSONB NOT NULL, -- Full message payload
  direction VARCHAR(10) NOT NULL, -- 'inbound' or 'outbound'
  status VARCHAR(20), -- sent, delivered, read, failed
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  ai_response TEXT,
  needs_human_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX idx_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_messages_property ON whatsapp_messages(property_id);
CREATE INDEX idx_messages_timestamp ON whatsapp_messages(created_at);
CREATE INDEX idx_messages_needs_review ON whatsapp_messages(needs_human_review) WHERE needs_human_review = TRUE;

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can only access their own messages" ON whatsapp_messages
  FOR ALL USING (auth.uid() = user_id);
```

---

## Phase 5: Webhook Implementation

### 5.1 Webhook Verification

**Create Webhook Verification Endpoint:**

```typescript
// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;
const APP_SECRET = process.env.META_APP_SECRET!;

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge);
  } else {
    console.error("Webhook verification failed");
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
}

// Webhook message processing (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Process webhook data
    await processWebhookData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 5.2 Message Processing Logic

**Create Message Processing Function:**

```typescript
// lib/webhook-processor.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processWebhookData(data: any) {
  if (data.object !== "whatsapp_business_account") {
    return;
  }

  for (const entry of data.entry) {
    for (const change of entry.changes) {
      if (change.field === "messages") {
        await processMessage(change.value);
      }
    }
  }
}

async function processMessage(messageData: any) {
  const { messages, metadata } = messageData;

  if (!messages || messages.length === 0) {
    return;
  }

  for (const message of messages) {
    try {
      // Find user by phone number ID
      const { data: phoneData } = await supabase
        .from("whatsapp_phone_numbers")
        .select("user_id, id")
        .eq("phone_number_id", metadata.phone_number_id)
        .single();

      if (!phoneData) {
        console.error("Phone number not found:", metadata.phone_number_id);
        continue;
      }

      // Store message in database
      const { data: savedMessage, error } = await supabase
        .from("whatsapp_messages")
        .insert({
          user_id: phoneData.user_id,
          phone_number_id: phoneData.id,
          message_id: message.id,
          conversation_id: `${message.from}-${metadata.phone_number_id}`,
          from_number: message.from,
          to_number: metadata.phone_number_id,
          message_type: message.type,
          content: message,
          direction: "inbound",
          status: "received",
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        continue;
      }

      // Trigger AI processing
      await processMessageWithAI(savedMessage);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }
}

async function processMessageWithAI(message: any) {
  // This will integrate with your AI processing logic
  // For now, we'll just mark it as needing processing
  await supabase
    .from("whatsapp_messages")
    .update({ ai_processed: false, needs_human_review: true })
    .eq("id", message.id);
}
```

---

## Phase 6: Message Sending Implementation

### 6.1 Send Message API

**Create Message Sending Utility:**

```typescript
// lib/whatsapp-sender.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendMessageOptions {
  to: string;
  message: string;
  userId: string;
  conversationId?: string;
  propertyId?: string;
}

export async function sendWhatsAppMessage(options: SendMessageOptions) {
  try {
    // Get user's WhatsApp configuration
    const { data: wabaData } = await supabase
      .from("whatsapp_business_accounts")
      .select(
        `
        *,
        whatsapp_phone_numbers (*)
      `
      )
      .eq("user_id", options.userId)
      .single();

    if (!wabaData || !wabaData.whatsapp_phone_numbers[0]) {
      throw new Error("No WhatsApp Business Account or phone number found");
    }

    const phoneNumber = wabaData.whatsapp_phone_numbers[0];

    // Send message via WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumber.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wabaData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: options.to,
          type: "text",
          text: { body: options.message },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to send message");
    }

    // Store sent message in database
    await supabase.from("whatsapp_messages").insert({
      user_id: options.userId,
      phone_number_id: phoneNumber.id,
      property_id: options.propertyId,
      message_id: result.messages[0].id,
      conversation_id:
        options.conversationId ||
        `${options.to}-${phoneNumber.phone_number_id}`,
      from_number: phoneNumber.phone_number,
      to_number: options.to,
      message_type: "text",
      content: { text: { body: options.message } },
      direction: "outbound",
      status: "sent",
    });

    return result;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}
```

### 6.2 AI Integration with Message Sending

**Create AI Response Handler:**

```typescript
// lib/ai-message-handler.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { sendWhatsAppMessage } from "./whatsapp-sender";

export async function processIncomingMessage(messageId: string) {
  try {
    // Get message and conversation history
    const { data: message } = await supabase
      .from("whatsapp_messages")
      .select(
        `
        *,
        properties (*)
      `
      )
      .eq("id", messageId)
      .single();

    if (!message) return;

    // Get conversation history
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", message.conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get property information
    const propertyInfo = message.properties;

    // Generate AI response
    const { text, finishReason } = await generateText({
      model: openai("gpt-4"),
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(propertyInfo),
        },
        ...formatConversationHistory(history || []),
        {
          role: "user",
          content: extractMessageText(message.content),
        },
      ],
      maxTokens: 500,
      temperature: 0.1,
    });

    // Calculate confidence (simplified - in practice, you might use more sophisticated methods)
    const confidence = calculateConfidence(text, finishReason);

    // Update message with AI response
    await supabase
      .from("whatsapp_messages")
      .update({
        ai_processed: true,
        ai_response: text,
        ai_confidence: confidence,
        needs_human_review: confidence < 0.95,
      })
      .eq("id", messageId);

    // Send response if confidence is high enough
    if (confidence >= 0.95) {
      await sendWhatsAppMessage({
        to: message.from_number,
        message: text,
        userId: message.user_id,
        conversationId: message.conversation_id,
        propertyId: message.property_id,
      });
    } else {
      // Send notification to user for manual review
      await sendNotificationToUser(message.user_id, messageId);
    }
  } catch (error) {
    console.error("Error processing message with AI:", error);
  }
}

function buildSystemPrompt(propertyInfo: any): string {
  return `You are an AI assistant for a short-term rental property. Here's the property information:

Property: ${propertyInfo?.name || "N/A"}
Address: ${propertyInfo?.address || "N/A"}
WiFi Password: ${propertyInfo?.wifi_password || "Not provided"}
Check-in Time: ${propertyInfo?.checkin_time || "Not specified"}
Check-out Time: ${propertyInfo?.checkout_time || "Not specified"}
House Rules: ${propertyInfo?.house_rules || "Standard rules apply"}
Emergency Contact: ${propertyInfo?.emergency_contact || "Host"}

Instructions:
- Only respond if you're 95%+ confident in your answer
- Be helpful, polite, and concise
- If you're not confident, say you need to check with the host
- Never make up information about the property
- Focus on answering common guest questions about amenities, instructions, and policies`;
}

function formatConversationHistory(history: any[]): any[] {
  return history.map((msg) => ({
    role: msg.direction === "inbound" ? "user" : "assistant",
    content: extractMessageText(msg.content),
  }));
}

function extractMessageText(content: any): string {
  if (content.text?.body) return content.text.body;
  if (content.type === "image") return "[Image sent]";
  if (content.type === "document") return "[Document sent]";
  return "[Message content not available]";
}

function calculateConfidence(text: string, finishReason: any): number {
  // Simplified confidence calculation
  // In practice, you might use more sophisticated methods
  if (
    text.toLowerCase().includes("i need to check") ||
    text.toLowerCase().includes("not sure") ||
    finishReason !== "stop"
  ) {
    return 0.5;
  }
  return 0.98; // High confidence for demonstration
}

async function sendNotificationToUser(userId: string, messageId: string) {
  // Implement notification logic (email, in-app notification, etc.)
  console.log(
    `Notification: Message ${messageId} needs manual review for user ${userId}`
  );
}
```

---

## Phase 7: Frontend Dashboard Components

### 7.1 WhatsApp Connection Status

**Create Connection Status Component:**

```typescript
// components/WhatsAppStatus.tsx
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WhatsAppAccount {
  id: string;
  waba_id: string;
  status: string;
  account_data: any;
  whatsapp_phone_numbers: Array<{
    phone_number: string;
    display_name: string;
    status: string;
  }>;
}

export default function WhatsAppStatus() {
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWhatsAppStatus();
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading WhatsApp status...</div>;
  }

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Connect your WhatsApp Business account to start receiving and
            responding to guest messages.
          </p>
          <WhatsAppSignup />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Business Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <Badge
              variant={account.status === "active" ? "default" : "secondary"}
            >
              {account.status}
            </Badge>
          </div>

          <div>
            <h4 className="font-medium mb-2">Connected Phone Numbers</h4>
            {account.whatsapp_phone_numbers.map((phone, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <div className="font-medium">{phone.display_name}</div>
                  <div className="text-sm text-gray-600">
                    {phone.phone_number}
                  </div>
                </div>
                <Badge
                  variant={
                    phone.status === "verified" ? "default" : "secondary"
                  }
                >
                  {phone.status}
                </Badge>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={fetchWhatsAppStatus}>
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 8: Testing & Deployment

### 8.1 Testing Checklist

**Local Development Testing:**

- [ ] Meta app configuration is correct
- [ ] Facebook SDK loads properly
- [ ] Embedded signup flow completes successfully
- [ ] Token exchange API works
- [ ] Database tables are created and accessible
- [ ] Webhook verification endpoint responds correctly
- [ ] Test webhook with Meta's testing tools

**Integration Testing:**

- [ ] End-to-end message flow (receive → AI process → send)
- [ ] Error handling for failed API calls
- [ ] Rate limiting compliance
- [ ] Token refresh mechanism
- [ ] Webhook signature verification

**Production Deployment:**

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain verification with Meta
- [ ] Webhook URL registered with WhatsApp Business API
- [ ] Monitoring and logging setup

### 8.2 Environment Variables

**Required Environment Variables:**

```bash
# Meta/Facebook Configuration
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
NEXT_PUBLIC_WHATSAPP_CONFIG_ID=your_whatsapp_config_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key
```

### 8.3 Monitoring & Maintenance

**Key Metrics to Monitor:**

- Webhook delivery success rate
- AI response confidence levels
- Message processing latency
- Token expiration alerts
- Error rates in message sending

**Regular Maintenance Tasks:**

- Token refresh automation
- Database cleanup for old messages
- Monitor WhatsApp Business account limits
- Update Meta API versions as needed

---

## Security Considerations

### Access Token Management

- Store tokens encrypted in database
- Implement token refresh mechanism
- Monitor token expiration dates
- Use service account for database operations

### Webhook Security

- Verify all webhook signatures
- Use HTTPS for all endpoints
- Implement rate limiting
- Log and monitor suspicious activity

### Data Privacy

- Encrypt sensitive message content
- Implement data retention policies
- Comply with GDPR/privacy regulations
- Provide user data export/deletion capabilities

---

## Next Steps

1. **Start with Phase 1**: Set up Meta Developer accounts and create the business app
2. **Implement Phase 2**: Build the frontend signup component
3. **Develop Phase 3**: Create the backend API routes for token exchange
4. **Set up Phase 4**: Create the database schema in Supabase
5. **Build Phase 5**: Implement webhook handling
6. **Add Phase 6**: Integrate message sending capabilities
7. **Create Phase 7**: Build dashboard components
8. **Execute Phase 8**: Test and deploy to production

Each phase should be completed and tested before moving to the next to ensure a stable integration.
