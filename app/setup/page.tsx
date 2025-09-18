"use client";

import { useState } from "react";
import Link from "next/link";

interface SetupFormData {
  user_id: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number: string;
  access_token: string;
  business_name: string;
}

export default function SetupPage() {
  const [formData, setFormData] = useState<SetupFormData>({
    user_id: "",
    waba_id: "",
    phone_number_id: "743610242176383", // Pre-filled from your webhook
    display_phone_number: "15551774811", // Pre-filled from your webhook
    access_token: "",
    business_name: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingAccounts, setExistingAccounts] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/setup/whatsapp-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Refresh existing accounts list
        fetchExistingAccounts();
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingAccounts = async () => {
    try {
      const response = await fetch("/api/setup/whatsapp-account");
      const data = await response.json();
      if (data.success) {
        setExistingAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  useState(() => {
    fetchExistingAccounts();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                WhatsApp Setup
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure your WhatsApp Business Account to enable message
                processing
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Setup Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Add WhatsApp Business Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID (UUID)
                </label>
                <input
                  type="text"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Supabase user ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  name="waba_id"
                  value={formData.waba_id}
                  onChange={handleInputChange}
                  placeholder="e.g., 1281481666794121"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  From your webhook payload: entry[0].id
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  name="phone_number_id"
                  value={formData.phone_number_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pre-filled from your webhook
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Phone Number
                </label>
                <input
                  type="text"
                  name="display_phone_number"
                  value={formData.display_phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pre-filled from your webhook
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Token
                </label>
                <input
                  type="text"
                  name="access_token"
                  value={formData.access_token}
                  onChange={handleInputChange}
                  placeholder="Your WhatsApp API access token"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500">
                    From Meta Developer Dashboard
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Access tokens expire periodically - update here if
                    message sending fails
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name (Optional)
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="Your business name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Setting up..." : "Setup WhatsApp Account"}
              </button>
            </form>

            {result && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  result.success
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                <h3 className="font-medium mb-2">
                  {result.success ? "Success!" : "Error"}
                </h3>
                <p className="text-sm">{result.message || result.error}</p>
                {result.success && result.account && (
                  <pre className="text-xs mt-2 bg-black/10 p-2 rounded overflow-auto">
                    {JSON.stringify(result.account, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Existing Accounts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Existing Accounts ({existingAccounts.length})
            </h2>

            {existingAccounts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No WhatsApp accounts configured yet
              </p>
            ) : (
              <div className="space-y-4">
                {existingAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {account.business_name || account.display_phone_number}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          account.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {account.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <strong>Phone:</strong> {account.display_phone_number}
                      </p>
                      <p>
                        <strong>Phone ID:</strong> {account.phone_number_id}
                      </p>
                      <p>
                        <strong>WABA ID:</strong> {account.waba_id}
                      </p>
                      <p>
                        <strong>User ID:</strong> {account.user_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
            Quick Setup Guide
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>1. Get your User ID:</strong> Create a Supabase user
              account first
            </p>
            <p>
              <strong>2. WABA ID:</strong> From your webhook payload, use the
              &quot;entry[0].id&quot; value:{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                1281481666794121
              </code>
            </p>
            <p>
              <strong>3. Access Token:</strong> Get this from your Meta
              Developer Dashboard
            </p>
            <p>
              <strong>4. Test:</strong> After setup, send another WhatsApp
              message to test
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
