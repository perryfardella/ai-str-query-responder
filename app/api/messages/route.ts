import { NextResponse } from "next/server";
import messageStore from "@/lib/message-store";

export async function GET() {
  try {
    const messages = messageStore.getRecentMessages(20);
    const activities = messageStore.getActivities();
    const stats = messageStore.getStats();

    return NextResponse.json({
      messages,
      activities,
      stats,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// For testing purposes - clear all messages
export async function DELETE() {
  try {
    messageStore.clearAll();
    return NextResponse.json({
      success: true,
      message: "All messages cleared",
    });
  } catch (error) {
    console.error("Error clearing messages:", error);
    return NextResponse.json(
      { error: "Failed to clear messages" },
      { status: 500 }
    );
  }
}
