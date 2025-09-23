"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MessageSquare,
  Home,
  Send,
  Clock,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ConversationWithMessages extends Conversation {
  messages?: Message[];
  property_name?: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<
    ConversationWithMessages[]
  >([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Set up conversation list realtime subscription
  const setupConversationSubscription = useCallback(async () => {
    try {
      // Clean up existing subscription
      if (conversationChannelRef.current) {
        await supabase.removeChannel(conversationChannelRef.current);
        conversationChannelRef.current = null;
      }

      // Use a simple broadcast channel instead of postgres_changes
      const channel = supabase.channel("conversations-updates");

      console.log("📡 Setting up conversation subscription...");

      // Just subscribe to the channel - we'll handle updates manually through the API
      const subscription = channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          conversationChannelRef.current = channel;
          console.log("✅ Connected to conversation updates channel");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Conversation channel error");
        }
      });

      return subscription;
    } catch (error) {
      console.error("Error setting up conversation subscription:", error);
    }
  }, [supabase]);

  // Set up message realtime subscription for selected conversation
  const setupMessageSubscription = useCallback(
    async (conversationId: number) => {
      try {
        // Clean up existing subscription
        if (messageChannelRef.current) {
          await supabase.removeChannel(messageChannelRef.current);
          messageChannelRef.current = null;
        }

        // Use a simple broadcast channel for this conversation
        const channel = supabase.channel(
          `conversation-${conversationId}-messages`
        );

        console.log(
          "📡 Setting up message subscription for conversation:",
          conversationId
        );

        // Listen for new message broadcasts
        channel.on("broadcast", { event: "new_message" }, (payload) => {
          console.log("📨 New message received:", payload);
          const newMessage = payload.payload as Message;

          // Only add if it's for this conversation
          if (newMessage.conversation_id === conversationId) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              const updated = [...prev, newMessage].sort(
                (a, b) =>
                  new Date(a.timestamp_whatsapp).getTime() -
                  new Date(b.timestamp_whatsapp).getTime()
              );
              // Auto-scroll to bottom after state update
              setTimeout(scrollToBottom, 100);
              return updated;
            });
          }
        });

        const subscription = channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            messageChannelRef.current = channel;
            console.log(
              "✅ Connected to message updates for conversation:",
              conversationId
            );
          } else if (status === "CHANNEL_ERROR") {
            console.error(
              "❌ Message channel error for conversation:",
              conversationId
            );
          }
        });

        return subscription;
      } catch (error) {
        console.error("Error setting up message subscription:", error);
      }
    },
    [supabase, scrollToBottom]
  );

  useEffect(() => {
    fetchConversations();
    setupConversationSubscription();

    // Cleanup on unmount
    return () => {
      if (conversationChannelRef.current) {
        supabase.removeChannel(conversationChannelRef.current);
        conversationChannelRef.current = null;
      }
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, [setupConversationSubscription, supabase]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch conversations");
      }

      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      setMessages(data.messages || []);
      // Auto-scroll to bottom after messages are loaded
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = (conversation: ConversationWithMessages) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    setupMessageSubscription(conversation.id);
    setNewMessage(""); // Clear message input when switching conversations
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/conversations/${selectedConversation.id}/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (result.token_expired) {
          alert(
            `⚠️ WhatsApp Access Token Expired!\n\n${result.details}\n\nPlease go to the Setup page to update your access token.`
          );
        } else {
          alert(`Failed to send message: ${result.error || "Unknown error"}`);
        }
        return;
      }

      // Clear the input
      setNewMessage("");

      // Refresh messages to show the sent message immediately
      // Since we're not using postgres_changes, we need to refresh manually
      await fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Failed to send message: ${
          error instanceof Error ? error.message : "Network error"
        }`
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatMessageContent = (message: Message) => {
    if (message.message_text) {
      return message.message_text;
    }

    switch (message.message_type) {
      case "image":
        return "📷 Image";
      case "document":
        return "📄 Document";
      case "audio":
        return "🎵 Audio";
      case "video":
        return "🎥 Video";
      case "location":
        return "📍 Location";
      default:
        return `${message.message_type} message`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-64">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading conversations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Conversations</h1>
              <p className="text-muted-foreground mt-2">
                Manage your WhatsApp conversations and message history
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations ({conversations.length})
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchConversations}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No conversations yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Conversations will appear here when you receive WhatsApp
                      messages
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => selectConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "bg-primary/5 border-l-4 border-l-primary"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {conversation.customer_phone_number.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              +{conversation.customer_phone_number}
                            </span>
                          </div>
                          {conversation.last_message_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(
                                conversation.last_message_at
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {conversation.property_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <Home className="h-3 w-3" />
                            {conversation.property_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {selectedConversation.customer_phone_number.slice(
                              -2
                            )}
                          </AvatarFallback>
                        </Avatar>
                        +{selectedConversation.customer_phone_number}
                      </CardTitle>
                      {selectedConversation.property_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Home className="h-3 w-3" />
                          {selectedConversation.property_name}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMessages(selectedConversation.id)}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />

                {/* Messages */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <ScrollArea
                    className="flex-1 px-4"
                    style={{ maxHeight: "calc(100vh - 400px)" }}
                  >
                    <div className="py-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              No messages in this conversation
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.direction === "inbound"
                                  ? "justify-start"
                                  : "justify-end"
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.direction === "inbound"
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <div className="text-sm">
                                  {formatMessageContent(message)}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(
                                      message.timestamp_whatsapp
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {message.is_auto_response && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Sent by AI
                                      </Badge>
                                    )}
                                    {message.needs_manual_review && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Review
                                      </Badge>
                                    )}
                                    {message.status && (
                                      <span className="opacity-60">
                                        {message.status === "delivered" && "✓✓"}
                                        {message.status === "read" && "✓✓"}
                                        {message.status === "sent" && "✓"}
                                        {message.status === "failed" && "✗"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Scroll anchor */}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Message Input */}
                <div className="border-t bg-background">
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                        className="flex-1 resize-none"
                        rows={2}
                        disabled={isSending}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4"
                      >
                        {isSending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Messages will be sent via WhatsApp Business API
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
