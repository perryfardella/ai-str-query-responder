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

  console.log("Webhook verification attempt:", {
    mode,
    token: token ? "***" : null,
  });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge);
  } else {
    console.error("Webhook verification failed - invalid token or mode");
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
}

// Webhook message processing (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    console.log("Received webhook:", {
      hasSignature: !!signature,
      bodyLength: body.length,
    });

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error("Invalid webhook signature");
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
  if (!signature || !APP_SECRET) {
    console.warn("Missing signature or app secret");
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// TODO
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processWebhookData(data: any) {
  console.log("Processing webhook data:", JSON.stringify(data, null, 2));

  if (data.object !== "whatsapp_business_account") {
    console.log("Ignoring non-WhatsApp webhook");
    return;
  }

  for (const entry of data.entry) {
    for (const change of entry.changes) {
      if (change.field === "messages") {
        await processMessage(change.value);
      } else if (change.field === "message_template_status_update") {
        console.log("Template status update:", change.value);
      } else {
        console.log("Unhandled webhook field:", change.field);
      }
    }
  }
}

// TODO
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processMessage(messageData: any) {
  console.log("Processing message data:", JSON.stringify(messageData, null, 2));

  const { messages, metadata, contacts, statuses } = messageData;

  // Process incoming messages
  if (messages && messages.length > 0) {
    for (const message of messages) {
      console.log("Incoming message:", {
        id: message.id,
        from: message.from,
        type: message.type,
        timestamp: message.timestamp,
      });

      // TODO: Store message in database
      // TODO: Trigger AI processing
      // TODO: Send automated response if confidence is high

      // For now, just log the message content
      if (message.type === "text") {
        console.log("Message text:", message.text.body);
      } else if (message.type === "image") {
        console.log("Image message received");
      } else if (message.type === "document") {
        console.log("Document message received");
      } else {
        console.log("Other message type:", message.type);
      }
    }
  }

  // Process message status updates (delivery, read receipts, etc.)
  if (statuses && statuses.length > 0) {
    for (const status of statuses) {
      console.log("Message status update:", {
        id: status.id,
        status: status.status,
        timestamp: status.timestamp,
      });
      // TODO: Update message status in database
    }
  }

  // Process contact information
  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      console.log("Contact info:", {
        wa_id: contact.wa_id,
        profile_name: contact.profile?.name,
      });
      // TODO: Store/update contact information
    }
  }
}
