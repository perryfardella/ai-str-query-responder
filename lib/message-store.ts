// Simple in-memory message store for webhook monitoring
// In production, this would be replaced with a proper database

export interface WhatsAppMessage {
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

export interface WebhookActivity {
  id: string;
  type: "message" | "status" | "verification";
  timestamp: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

class MessageStore {
  private messages: WhatsAppMessage[] = [];
  private activities: WebhookActivity[] = [];
  private maxMessages = 100; // Keep last 100 messages
  private maxActivities = 50; // Keep last 50 webhook activities

  addMessage(message: WhatsAppMessage) {
    this.messages.unshift(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }

    // Also add as activity
    this.addActivity({
      id: `msg-${message.id}`,
      type: "message",
      timestamp: new Date(),
      data: message,
    });
  }

  addActivity(activity: WebhookActivity) {
    this.activities.unshift(activity);
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  getMessages(): WhatsAppMessage[] {
    return [...this.messages];
  }

  getActivities(): WebhookActivity[] {
    return [...this.activities];
  }

  getRecentMessages(limit = 10): WhatsAppMessage[] {
    return this.messages.slice(0, limit);
  }

  clearAll() {
    this.messages = [];
    this.activities = [];
  }

  getStats() {
    return {
      totalMessages: this.messages.length,
      totalActivities: this.activities.length,
      lastActivity: this.activities[0]?.timestamp || null,
    };
  }
}

// Singleton instance
const messageStore = new MessageStore();
export default messageStore;
