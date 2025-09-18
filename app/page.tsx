"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface WhatsAppMessage {
  id: string;
  from: string;
  to?: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  timestamp: string;
  receivedAt: Date;
  contactName?: string;
}

interface WebhookActivity {
  id: string;
  type: "message" | "status" | "verification";
  timestamp: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

interface MessageData {
  messages: WhatsAppMessage[];
  activities: WebhookActivity[];
  stats: {
    totalMessages: number;
    totalActivities: number;
    lastActivity: string | null;
  };
}

export default function Home() {
  const [messageData, setMessageData] = useState<MessageData>({
    messages: [],
    activities: [],
    stats: { totalMessages: 0, totalActivities: 0, lastActivity: null },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setMessageData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = async () => {
    try {
      const response = await fetch("/api/messages", { method: "DELETE" });
      if (response.ok) {
        setMessageData({
          messages: [],
          activities: [],
          stats: { totalMessages: 0, totalActivities: 0, lastActivity: null },
        });
      }
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatMessageContent = (message: WhatsAppMessage) => {
    if (message.type === "text" && message.content.text?.body) {
      return message.content.text.body;
    } else if (message.type === "image") {
      return "📷 Image message";
    } else if (message.type === "document") {
      return "📄 Document message";
    } else {
      return `${message.type} message`;
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="AI STR Query Responder"
                width={120}
                height={25}
                priority
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                WhatsApp Webhook Monitor
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/setup"
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Setup WhatsApp
              </a>
              <a
                href="/conversations"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                View Conversations
              </a>
              <a
                href="/api/debug/database"
                target="_blank"
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Debug Database
              </a>
              <a
                href="/api/debug/ai-test"
                target="_blank"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                Test AI
              </a>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/debug/fix-phone-link", {
                      method: "POST",
                    });
                    const result = await response.json();
                    alert(
                      result.success
                        ? `✅ ${result.message}`
                        : `❌ ${result.error}`
                    );
                  } catch (error) {
                    alert(
                      `❌ Error: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    );
                  }
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
              >
                Fix Phone Link
              </button>
              <a
                href="/api/debug/whatsapp-token"
                target="_blank"
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Check Token
              </a>
              <button
                onClick={fetchMessages}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={clearMessages}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Messages
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messageData.stats.totalMessages}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Activities
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messageData.stats.totalActivities}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {messageData.stats.totalActivities > 0 ? "Active" : "Waiting"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Update
              </h3>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Messages Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Messages ({messageData.messages.length})
              </h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <p className="text-gray-500 dark:text-gray-400">
                  Loading messages...
                </p>
              ) : messageData.messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No messages yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Send a message to your WhatsApp Business number to see it
                    appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messageData.messages.map((message) => (
                    <div
                      key={message.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {message.contactName || message.from}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {message.type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(message.receivedAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {formatMessageContent(message)}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        From: {message.from} → To: {message.to}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activities Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                All Webhook Data ({messageData.activities.length})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Raw webhook payloads for debugging
              </p>
            </div>
            <div className="p-6">
              {messageData.activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No webhook data received yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Send test data or real WhatsApp messages to see webhook
                    payloads here
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messageData.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              activity.data.type === "webhook_received"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : activity.type === "message"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : activity.type === "verification"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {activity.data.type || activity.type}
                          </span>
                          {activity.data.object && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {activity.data.object}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      {/* Show webhook payload details */}
                      {activity.data.type === "webhook_received" && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Object:</span>{" "}
                            {activity.data.object || "undefined"} |
                            <span className="font-medium"> Has Entry:</span>{" "}
                            {activity.data.hasEntry ? "Yes" : "No"} |
                            <span className="font-medium"> Has Field:</span>{" "}
                            {activity.data.hasField ? "Yes" : "No"} |
                            <span className="font-medium"> Size:</span>{" "}
                            {activity.data.payloadSize} bytes
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                              View Full Payload
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-48">
                              {JSON.stringify(activity.data.payload, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {/* Show other activity types */}
                      {activity.data.type !== "webhook_received" && (
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {activity.type === "message" &&
                            `Message from ${activity.data.from}`}
                          {activity.type === "verification" &&
                            `Webhook verification ${
                              activity.data.success ? "succeeded" : "failed"
                            }`}
                          {activity.type === "status" &&
                            `Status update: ${activity.data.status}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>AI STR Query Responder - WhatsApp Business Integration</p>
          <p className="mt-1">
            Webhook URL:{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              /api/webhooks/whatsapp
            </code>
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a
              href="/privacy-policy"
              className="hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <span>© {new Date().getFullYear()} AI STR Query Responder</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
