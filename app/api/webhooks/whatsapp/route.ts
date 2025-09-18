import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import messageStore from "@/lib/message-store";

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

  // Log verification activity
  messageStore.addActivity({
    id: `verify-${Date.now()}`,
    type: "verification",
    timestamp: new Date(),
    data: { mode, success: mode === "subscribe" && token === VERIFY_TOKEN },
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

  // Log ALL webhook data to the message store for debugging
  messageStore.addActivity({
    id: `webhook-${Date.now()}`,
    type: "verification",
    timestamp: new Date(),
    data: {
      type: "webhook_received",
      payload: data,
      object: data.object,
      hasEntry: !!data.entry,
      hasField: !!data.field,
      payloadSize: JSON.stringify(data).length,
    },
  });

  // Handle any webhook data - don't filter by object type for debugging
  console.log("Webhook object type:", data.object);
  console.log("Webhook has entry:", !!data.entry);
  console.log("Webhook has field:", !!data.field);

  // Process WhatsApp Business Account webhooks
  if (data.object === "whatsapp_business_account" && data.entry) {
    console.log("Processing WhatsApp Business Account webhook");
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
    return;
  }

  // Handle test format or other webhook types
  if (data.field && data.value) {
    console.log("Processing test/direct webhook format");
    if (data.field === "messages") {
      await processMessage(data.value);
    } else {
      console.log("Unhandled test webhook field:", data.field);
    }
    return;
  }

  // Log unrecognized webhook format
  console.log("Unrecognized webhook format - logging for debugging");
  console.log("Data keys:", Object.keys(data));
  console.log("Data:", data);
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

      // Store message in our message store
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contact = contacts?.find((c: any) => c.wa_id === message.from);
      messageStore.addMessage({
        id: message.id,
        from: message.from,
        to: metadata.phone_number_id,
        type: message.type,
        content: message,
        timestamp: message.timestamp,
        receivedAt: new Date(),
        contactName: contact?.profile?.name,
      });

      // Log message content for debugging
      if (message.type === "text") {
        console.log("Message text:", message.text.body);
      } else if (message.type === "image") {
        console.log("Image message received");
      } else if (message.type === "document") {
        console.log("Document message received");
      } else {
        console.log("Other message type:", message.type);
      }

      // TODO: Trigger AI processing
      // TODO: Send automated response if confidence is high
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

      // Log status update as activity
      messageStore.addActivity({
        id: `status-${status.id}-${Date.now()}`,
        type: "status",
        timestamp: new Date(),
        data: status,
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
