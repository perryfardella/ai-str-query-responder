# Product Requirements Document (PRD) for AI STR Query Responder

## 1. Introduction

### 1.1 Purpose

This PRD outlines the requirements for building "AI STR Query Responder," a web application designed to automate responses to guest inquiries in short-term rental (STR) properties via WhatsApp Business. The app leverages AI to handle common queries based on property details and conversation history, escalating to human intervention when necessary. This reduces manual effort for property managers while ensuring accurate and timely responses.

### 1.2 Scope

- **In Scope:**

  - User authentication via WhatsApp Business account (using OAuth 2.0 where possible).
  - Linking WhatsApp conversations to specific STR properties.
  - Receiving messages via WhatsApp Business webhooks.
  - AI evaluation of messages using conversation history and property data.
  - Automated reply generation and sending via WhatsApp Business API (with high confidence threshold).
  - Escalation notifications for low-confidence scenarios.
  - Storage of property details, messages, and user data.
  - Payment processing for subscription-based access.
  - Basic UI for managing properties, viewing conversations, and settings.

- **Out of Scope:**
  - Advanced analytics or reporting (e.g., response success rates).
  - Multi-language support beyond English (initially).
  - Integration with other messaging platforms (e.g., SMS, email).
  - Custom AI model training; rely on pre-trained models via Vercel AI SDK.
  - Mobile app version; focus on web app only.

### 1.3 Overview

The app is a Next.js web application that acts as an AI-powered autoresponder for STR hosts. Users sign in, link their WhatsApp Business conversations to properties, and the system handles incoming messages intelligently. If the AI is highly confident (95%+), it replies automatically; otherwise, it notifies the user for manual response.

## 2. Goals and Objectives

- **Primary Goal:** Automate 80%+ of routine guest queries (e.g., WiFi passwords, check-out times) to save time for STR hosts.
- **Objectives:**
  - Provide seamless integration with WhatsApp Business for message handling.
  - Ensure AI responses are accurate and context-aware.
  - Offer a subscription model for monetization.
  - Maintain data security and compliance with privacy regulations (e.g., GDPR for user messages).
  - Achieve high uptime for webhook processing to avoid missed messages.

## 3. Target Users

- **Primary Users:** STR property managers or hosts who use WhatsApp Business for guest communication. They manage 1–50 properties and handle frequent queries like amenities, instructions, or issues.
- **User Personas:**
  - **Busy Host:** Individual Airbnb/VRBO host with multiple listings, seeking automation to reduce response time.
  - **Property Manager:** Agency managing several properties, needing scalable tools for team collaboration.
- **Assumptions:** Users have an active WhatsApp Business account and are familiar with basic web apps.

## 4. Features

### 4.1 User Authentication

- Users sign in using their WhatsApp Business account via OAuth 2.0 (leveraging Meta's authentication for WhatsApp Business API).
- If direct WhatsApp OAuth is not feasible with Supabase, fallback to email/password auth with manual WhatsApp token input.
- Post-sign-in, users verify their WhatsApp Business phone number and grant API access.
- Supabase Auth handles session management, storing user IDs and linked WhatsApp details.

### 4.2 Property Management

- Users can create, edit, and delete STR properties.
- Each property includes fields like:
  - Name/Address.
  - WiFi password.
  - Bin collection days.
  - Check-in/check-out times.
  - House rules.
  - Emergency contacts.
  - Custom notes (e.g., parking instructions).
- Data stored in Supabase database.
- UI: Form-based interface with validation.

### 4.3 Conversation Linking

- Users link WhatsApp conversations (by phone number or conversation ID) to specific properties.
- Support for multiple conversations per property (e.g., for group chats or multiple guests).
- UI: Dashboard to search/select conversations and assign to properties.

### 4.4 Webhook Integration

- Set up WhatsApp Business webhooks to receive incoming messages in real-time.
- Webhook endpoint in Next.js API routes processes payloads, authenticates, and stores messages in Supabase.
- Handle message types: Text, images (basic acknowledgment only), and attachments (log but not process via AI).

### 4.5 AI Response Generation

- On receiving a message, fetch full conversation history and linked property details from Supabase.
- Use Vercel AI SDK to interact with an AI model (e.g., GPT-4 or similar).
- Prompt the AI with: Conversation history, property info, and instructions to generate a reply only if 95%+ confident (AI outputs a confidence score; threshold enforced in code).
- If confidence <95%, return error and trigger notification.
- AI prompt guidelines: Be polite, concise, and relevant; avoid hallucinations.

### 4.6 Message Sending

- If AI generates a reply with high confidence, send it via WhatsApp Business API.
- Log all sent/received messages in Supabase for auditing.

### 4.7 Notification System

- For low-confidence cases, ping the user via email or in-app notification (using Supabase real-time or external service like Twilio if needed).
- UI: Dashboard section for pending human responses, with quick reply tools.

### 4.8 Payments

- Integrate Stripe for subscription payments (e.g., monthly tiers based on property count or message volume).
- Features: Billing dashboard, subscription management, invoice history.
- Free tier: Limited to 1 property and 50 messages/month.

## 5. Technical Requirements

### 5.1 Framework and Tools

- **Frontend/Backend:** Next.js (full-stack).
- **Package Manager:** pnpm (Use pnpm dlx for script executions instead of npx).
- **UI Library:** Shadcn UI components with Tailwind CSS for styling.
- **Deployment:** Vercel (for hosting and AI SDK integration).

### 5.2 AI Integration

- Vercel AI SDK for AI calls (compatible with models like OpenAI, Anthropic).
- Implement confidence scoring: Use model APIs that provide probability/logits, or include in prompt for self-reported confidence.

### 5.3 Database and Storage

- Supabase for:
  - User auth (OAuth or email).
  - PostgreSQL tables for properties, messages, conversations, and links.
  - Real-time subscriptions for notifications.
  - Storage for any uploaded property documents/images.

### 5.4 APIs and Integrations

- WhatsApp Business API for sending messages and webhooks.
- Stripe API for payments.
- Environment variables for API keys/tokens.

### 5.5 Security and Compliance

- HTTPS enforcement.
- Data encryption in transit and at rest (via Supabase).
- Rate limiting on API routes.
- Compliance: Handle user consent for message storage; anonymize sensitive data.

## 6. User Flows

### 6.1 Sign-Up and Onboarding

1. User visits app, clicks "Sign in with WhatsApp Business."
2. Redirects to Meta OAuth flow; grants access.
3. Post-auth, create first property and link a conversation.
4. Set up webhook (guided setup with verification).

### 6.2 Handling a Message

1. Guest sends message via WhatsApp.
2. Webhook receives it, stores in DB.
3. App fetches context, calls AI.
4. If confident, sends reply; else, notifies user.
5. User views dashboard for escalations.

### 6.3 Subscription Management

1. User navigates to billing page.
2. Selects plan, enters payment details via Stripe.
3. Subscribes; app enforces limits based on tier.

## 7. Non-Functional Requirements

- **Performance:** Response time <5s for AI processing; handle 100 messages/minute.
- **Scalability:** Supabase scales automatically; Next.js for serverless.
- **Accessibility:** WCAG 2.1 compliant UI.
- **Reliability:** 99.9% uptime; error handling for API failures.
- **Mobile Responsiveness:** Fully responsive design.

## 8. Assumptions and Dependencies

- **Assumptions:**
  - WhatsApp Business OAuth is feasible via Meta's APIs.
  - AI models provide reliable confidence scores.
  - Users have valid WhatsApp Business accounts.
- **Dependencies:**
  - Meta Developers account for app setup.
  - Vercel account for deployment.
  - Stripe and Supabase accounts.

## 9. Risks and Mitigations

- **Risk:** OAuth integration issues with WhatsApp – **Mitigation:** Fallback to manual token input; test early.
- **Risk:** AI inaccuracies – **Mitigation:** Strict confidence threshold; user override options.
- **Risk:** Webhook reliability – **Mitigation:** Implement retries and monitoring.
- **Risk:** Data privacy breaches – **Mitigation:** Regular audits; minimal data retention.

## 10. Timeline and Milestones (High-Level)

- **Phase 1 (2 weeks):** Setup Next.js project, auth, and basic UI.
- **Phase 2 (3 weeks):** Property management and conversation linking.
- **Phase 3 (3 weeks):** Webhook and AI integration.
- **Phase 4 (2 weeks):** Payments and notifications.
- **Phase 5 (1 week):** Testing and deployment.
