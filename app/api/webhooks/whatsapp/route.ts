import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import messageStore from "@/lib/message-store";
import {
  findWhatsAppAccount,
  getOrCreateConversation,
  getPropertyForPhoneNumber,
  markConversationNeedsIntervention,
  processWhatsAppMessage,
  saveMessage,
  shouldAutoRespond,
  updateConversationLastMessage,
  updateMessageStatus,
  type WhatsAppMessageData,
} from "@/lib/whatsapp-db";
import { generateAIResponse } from "@/lib/ai-response";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  signature: string | null,
): boolean {
  if (!signature || !APP_SECRET) {
    console.warn("Missing signature or app secret");
    return false;
  }

  const expectedSignature = "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
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
async function processMessage(messageData: WhatsAppMessageData) {
  console.log("Processing message data:", JSON.stringify(messageData, null, 2));

  const { messages, metadata, contacts, statuses } = messageData;

  // Find the WhatsApp Business Account for this phone number
  const whatsappAccount = await findWhatsAppAccount(metadata.phone_number_id);
  if (!whatsappAccount) {
    console.error(
      "No WhatsApp Business Account found for phone number:",
      metadata.phone_number_id,
    );
    return;
  }

  console.log(
    "Found WhatsApp account:",
    whatsappAccount.id,
    "for user:",
    whatsappAccount.user_id,
  );

  // Process incoming messages
  if (messages && messages.length > 0) {
    for (const message of messages) {
      try {
        console.log("Processing incoming message:", {
          id: message.id,
          from: message.from,
          type: message.type,
          timestamp: message.timestamp,
        });

        // Process the message data
        const processedMessage = processWhatsAppMessage(
          message,
          metadata,
          contacts,
        );

        // Store message in memory store for debugging (keep existing functionality)
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

        // Get or create conversation
        const conversationId = await getOrCreateConversation(
          whatsappAccount.user_id,
          whatsappAccount.id,
          message.from,
          metadata.display_phone_number,
        );

        if (!conversationId) {
          console.error("Failed to get/create conversation");
          continue;
        }

        console.log("Using conversation ID:", conversationId);

        // For testing, enable auto-respond for all new phone numbers
        // Check if auto-response is enabled for this phone number
        let autoRespondEnabled = await shouldAutoRespond(
          whatsappAccount.user_id,
          whatsappAccount.id,
          message.from,
        );

        // For testing, always enable auto-respond
        console.log("Original auto-respond status:", autoRespondEnabled);
        autoRespondEnabled = true;

        console.log("Auto-respond enabled:", autoRespondEnabled);

        // Get property information for context
        let propertyInfo = await getPropertyForPhoneNumber(
          whatsappAccount.user_id,
          whatsappAccount.id,
          message.from,
        );

        // If no property is linked, automatically create and link the fictional property for testing
        if (!propertyInfo) {
          console.log(
            "No property linked, creating fictional property for testing",
          );

          try {
            // Create fictional property
            const { data: newProperty, error: propertyError } =
              await supabaseAdmin
                .from("properties")
                .insert({
                  user_id: whatsappAccount.user_id,
                  name: "Sunny Downtown Loft",
                  address: "123 Main Street, Downtown, San Francisco, CA 94102",
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

            if (!propertyError && newProperty) {
              // Link phone number to the new property
              const { error: linkError } = await supabaseAdmin
                .from("phone_number_property_links")
                .insert({
                  user_id: whatsappAccount.user_id,
                  whatsapp_account_id: whatsappAccount.id,
                  property_id: newProperty.id,
                  customer_phone_number: message.from,
                  auto_respond_enabled: true,
                  created_by_user_id: whatsappAccount.user_id,
                });

              if (!linkError) {
                console.log(
                  "Successfully linked phone number to fictional property",
                );

                // Refresh property info
                propertyInfo = await getPropertyForPhoneNumber(
                  whatsappAccount.user_id,
                  whatsappAccount.id,
                  message.from,
                );
              } else {
                console.error("Error linking phone to property:", linkError);
              }
            } else {
              console.error(
                "Error creating fictional property:",
                propertyError,
              );
            }
          } catch (autoSetupError) {
            console.error("Error in auto-setup:", autoSetupError);
          }
        }

        if (propertyInfo) {
          console.log(
            "Found/created property info:",
            propertyInfo.property_name,
          );
        }

        // Determine if manual review is needed
        const needsManualReview = !autoRespondEnabled || !propertyInfo;

        // Save message to database
        const savedMessage = await saveMessage(
          conversationId,
          processedMessage,
          false, // is_auto_response
          needsManualReview,
          undefined, // ai_confidence_score
          needsManualReview
            ? "Auto-response disabled or no property linked"
            : undefined,
        );

        if (savedMessage) {
          console.log("Message saved to database:", savedMessage.id);

          // Update conversation metadata
          await updateConversationLastMessage(
            conversationId,
            "inbound",
            processedMessage.timestamp_whatsapp,
            needsManualReview,
          );

          // Mark conversation for manual intervention if needed
          if (needsManualReview) {
            await markConversationNeedsIntervention(
              conversationId,
              autoRespondEnabled
                ? "No property linked"
                : "Auto-response disabled",
            );
          }

          // Trigger AI processing if auto-response is enabled and we have text content
          console.log("AI Processing Check:", {
            autoRespondEnabled,
            hasPropertyInfo: !!propertyInfo,
            messageType: message.type,
            hasMessageText: !!processedMessage.message_text,
            messageText: processedMessage.message_text,
            willTriggerAI: autoRespondEnabled && propertyInfo &&
              message.type === "text" && processedMessage.message_text,
          });

          if (
            autoRespondEnabled && propertyInfo && message.type === "text" &&
            processedMessage.message_text
          ) {
            console.log(
              "✅ Triggering AI processing for message:",
              savedMessage.id,
            );

            try {
              const aiResult = await generateAIResponse(
                conversationId,
                processedMessage.message_text,
                propertyInfo.property_id,
              );

              console.log("AI processing result:", {
                confidence: aiResult.confidence,
                shouldSend: aiResult.shouldSend,
                reasoning: aiResult.reasoning,
              });

              if (aiResult.shouldSend && aiResult.confidence >= 0.95) {
                // Send AI response via WhatsApp
                const sendResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${metadata.phone_number_id}/messages`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${whatsappAccount.access_token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      messaging_product: "whatsapp",
                      to: message.from,
                      type: "text",
                      text: { body: aiResult.response },
                    }),
                  },
                );

                const sendResult = await sendResponse.json();

                if (sendResponse.ok) {
                  console.log(
                    "AI response sent successfully:",
                    sendResult.messages[0].id,
                  );

                  // Save the AI response as an outbound message
                  const aiMessageData = {
                    whatsapp_message_id: sendResult.messages[0].id,
                    direction: "outbound" as const,
                    from_phone_number: metadata.display_phone_number,
                    to_phone_number: message.from,
                    message_type: "text",
                    content: {
                      text: { body: aiResult.response },
                      type: "text",
                    },
                    message_text: aiResult.response,
                    timestamp_whatsapp: new Date().toISOString(),
                  };

                  await saveMessage(
                    conversationId,
                    aiMessageData,
                    true, // is_auto_response
                    false, // needs_manual_review
                    aiResult.confidence,
                    undefined,
                  );

                  // Update conversation with AI response
                  await updateConversationLastMessage(
                    conversationId,
                    "outbound",
                    aiMessageData.timestamp_whatsapp,
                    false,
                  );

                  console.log("AI response saved to database");
                } else {
                  console.error("Failed to send AI response:", sendResult);

                  // Update original message to indicate AI processing failed
                  await supabaseAdmin
                    .from("messages")
                    .update({
                      ai_processing_error: `Failed to send AI response: ${
                        sendResult.error?.message || "Unknown error"
                      }`,
                      needs_manual_review: true,
                    })
                    .eq("id", savedMessage.id);

                  await markConversationNeedsIntervention(
                    conversationId,
                    "AI response generation succeeded but sending failed",
                  );
                }
              } else {
                console.log("AI confidence too low, marking for manual review");

                // Update message to indicate manual review needed
                await supabaseAdmin
                  .from("messages")
                  .update({
                    ai_confidence_score: aiResult.confidence,
                    ai_processing_error: aiResult.reasoning,
                    needs_manual_review: true,
                  })
                  .eq("id", savedMessage.id);

                await markConversationNeedsIntervention(
                  conversationId,
                  `AI confidence too low (${
                    Math.round(aiResult.confidence * 100)
                  }%): ${aiResult.reasoning}`,
                );
              }
            } catch (aiError) {
              console.error("AI processing error:", aiError);

              // Update message to indicate AI processing failed
              await supabaseAdmin
                .from("messages")
                .update({
                  ai_processing_error: aiError instanceof Error
                    ? aiError.message
                    : "AI processing failed",
                  needs_manual_review: true,
                })
                .eq("id", savedMessage.id);

              await markConversationNeedsIntervention(
                conversationId,
                "AI processing failed",
              );
            }
          }
        }

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
      } catch (error) {
        console.error("Error processing message:", message.id, error);
      }
    }
  }

  // Process message status updates (delivery, read receipts, etc.)
  if (statuses && statuses.length > 0) {
    for (const status of statuses) {
      try {
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

        // Update message status in database
        await updateMessageStatus(status.id, status.status);
      } catch (error) {
        console.error("Error processing status update:", status.id, error);
      }
    }
  }

  // Process contact information
  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      console.log("Contact info:", {
        wa_id: contact.wa_id,
        profile_name: contact.profile?.name,
      });
      // Contact information is already stored with messages
    }
  }
}
