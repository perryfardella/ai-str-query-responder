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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  STR Query Responder
                </span>
              </Link>
            </div>
            <Button
              asChild
              variant="outline"
              className="bg-white/90 dark:bg-gray-800/90"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Conversations
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your WhatsApp conversations and message history
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    Conversations ({conversations.length})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchConversations}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">
                      No conversations yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                        className={`p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-emerald-500 text-white font-medium">
                                {conversation.customer_phone_number.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              +{conversation.customer_phone_number}
                            </span>
                          </div>
                          {conversation.last_message_at && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                              <Clock className="h-3 w-3" />
                              {new Date(
                                conversation.last_message_at
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {conversation.property_name && (
                          <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-2">
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
          <Card className="lg:col-span-2 flex flex-col h-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-emerald-500 text-white font-medium">
                            {selectedConversation.customer_phone_number.slice(
                              -2
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-900 dark:text-white">
                          +{selectedConversation.customer_phone_number}
                        </span>
                      </CardTitle>
                      {selectedConversation.property_name && (
                        <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 mt-1">
                          <Home className="h-3 w-3" />
                          {selectedConversation.property_name}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMessages(selectedConversation.id)}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />

                {/* Messages */}
                <div className="flex flex-col overflow-hidden h-[calc(100vh-480px)]">
                  <ScrollArea className="flex-1 px-4 h-full">
                    <div className="py-4 space-y-4 min-h-0">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
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
                                    ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white"
                                    : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md"
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
                <div className="border-t bg-background flex-shrink-0">
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
                        className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
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
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Empty State Header - matches conversation header height */}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-900 dark:text-white">
                          Select a conversation
                        </span>
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <Separator />

                {/* Empty State Content - matches messages area height */}
                <div className="flex flex-col overflow-hidden h-[calc(100vh-480px)]">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Choose a conversation from the list to view messages
                      </p>
                    </div>
                  </div>
                </div>

                {/* Empty State Footer - matches input area height exactly */}
                <div className="border-t bg-background flex-shrink-0">
                  <div className="p-4">
                    <div className="flex gap-2">
                      <textarea
                        readOnly
                        rows={2}
                        className="flex-1 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        value="Select a conversation to start messaging"
                      />
                      <Button
                        disabled
                        className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md opacity-50"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
