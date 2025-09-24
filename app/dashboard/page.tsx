"use client";

import Link from "next/link";

// Sample data for MVP dashboard
const sampleProperties = [
  {
    id: "prop-001",
    name: "Sunset Beach Villa",
    address: "123 Ocean Drive, Malibu, CA",
    phoneNumber: "+1234567890",
    status: "active",
    totalMessages: 47,
    pendingResponses: 2,
    automationRate: 85,
    lastGuestMessage: "2 hours ago",
    recentIssues: [
      {
        type: "wifi",
        message: "Guest asking about WiFi password",
        time: "30 min ago",
      },
      {
        type: "checkout",
        message: "Checkout time confirmation needed",
        time: "2 hours ago",
      },
    ],
  },
  {
    id: "prop-002",
    name: "Downtown Loft",
    address: "456 Main Street, Los Angeles, CA",
    phoneNumber: "+1234567891",
    status: "active",
    totalMessages: 23,
    pendingResponses: 0,
    automationRate: 92,
    lastGuestMessage: "1 day ago",
    recentIssues: [],
  },
  {
    id: "prop-003",
    name: "Mountain Cabin Retreat",
    address: "789 Pine Road, Big Bear, CA",
    phoneNumber: "+1234567892",
    status: "inactive",
    totalMessages: 8,
    pendingResponses: 1,
    automationRate: 75,
    lastGuestMessage: "3 days ago",
    recentIssues: [
      {
        type: "maintenance",
        message: "Heating system inquiry",
        time: "3 days ago",
      },
    ],
  },
];

const overallStats = {
  totalProperties: 3,
  activeProperties: 2,
  totalMessages: 78,
  pendingResponses: 3,
  averageAutomationRate: 84,
  todayMessages: 12,
};

export default function Dashboard() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  STR Query Responder
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/conversations"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Conversations
              </Link>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Property Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your property automation and guest communications
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Properties
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalProperties}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Properties
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {overallStats.activeProperties}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Messages
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalMessages}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pending Responses
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {overallStats.pendingResponses}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Automation Rate
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {overallStats.averageAutomationRate}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Today&apos;s Messages
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.todayMessages}
            </p>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Properties Overview
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sampleProperties.map((property) => (
                  <div
                    key={property.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Property Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {property.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {property.status}
                          </span>
                          {property.pendingResponses > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
                              {property.pendingResponses} pending
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {property.address}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>📱 {property.phoneNumber}</span>
                          <span>💬 {property.totalMessages} messages</span>
                          <span>🤖 {property.automationRate}% automated</span>
                          <span>
                            🕒 Last message: {property.lastGuestMessage}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/property/${property.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                        >
                          Manage Property
                        </Link>
                        <Link
                          href="/conversations"
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium text-center"
                        >
                          View Messages
                        </Link>
                      </div>
                    </div>

                    {/* Recent Issues */}
                    {property.recentIssues.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recent Issues Requiring Attention:
                        </h4>
                        <div className="space-y-2">
                          {property.recentIssues.map((issue, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  issue.type === "wifi"
                                    ? "bg-yellow-500"
                                    : issue.type === "checkout"
                                    ? "bg-blue-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <span className="text-gray-600 dark:text-gray-300">
                                {issue.message}
                              </span>
                              <span className="text-gray-400 text-xs">
                                ({issue.time})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add New Property
                  </span>
                </button>

                <Link
                  href="/conversations"
                  className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 transition-colors text-center block"
                >
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    View All Messages
                  </span>
                </Link>

                <button className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors text-center">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
