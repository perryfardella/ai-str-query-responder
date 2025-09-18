"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Conversation, Message } from "@/lib/supabase";

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

  useEffect(() => {
    fetchConversations();
  }, []);

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
        throw new Error(result.error || "Failed to send message");
      }

      // Clear the input
      setNewMessage("");

      // Refresh messages to show the sent message
      await fetchMessages(selectedConversation.id);

      // Refresh conversations to update last message info
      await fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Failed to send message: ${
          error instanceof Error ? error.message : "Unknown error"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Conversations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your WhatsApp conversations and message history
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversations ({conversations.length})
              </h2>
            </div>

            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No conversations yet
                  </p>
                  <p className="text-sm text-gray-400">
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
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                        selectedConversation?.id === conversation.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {conversation.customer_phone_number}
                          </span>
                          {conversation.requires_manual_intervention && (
                            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded animate-pulse">
                              🚨 Needs Attention
                            </span>
                          )}
                        </div>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                        )}
                      </div>

                      {conversation.property_name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          🏠 {conversation.property_name}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            conversation.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {conversation.status}
                        </span>
                        {conversation.unread_count > 0 && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedConversation.customer_phone_number}
                      </h2>
                      {selectedConversation.property_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🏠 {selectedConversation.property_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          selectedConversation.requires_manual_intervention
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {selectedConversation.requires_manual_intervention
                          ? "Needs Attention"
                          : "Active"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages in this conversation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                : "bg-blue-500 text-white shadow-lg"
                            }`}
                          >
                            <div className="text-sm">
                              {formatMessageContent(message)}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                              <span>
                                {formatTimestamp(message.timestamp_whatsapp)}
                              </span>
                              <div className="flex items-center gap-1">
                                {message.is_auto_response && (
                                  <span className="bg-green-200 text-green-800 px-1 rounded text-xs">
                                    Auto
                                  </span>
                                )}
                                {message.needs_manual_review && (
                                  <span className="bg-yellow-200 text-yellow-800 px-1 rounded text-xs">
                                    Review
                                  </span>
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
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      disabled={isSending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </div>
                      ) : (
                        "Send"
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Messages will be sent via WhatsApp Business API
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
