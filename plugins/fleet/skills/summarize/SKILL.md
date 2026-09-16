---
name: summarize
description: Generate a comprehensive user journey summary for a module or feature scope
allowed-tools:
  - Task
  - Glob
  - Grep
  - Read
---

# Summarize Skill

Generate a comprehensive user journey summary for the specified scope (module, feature, or integration).

## Instructions

When the user invokes `/summarize [scope]`, follow these steps:

### 1. Understand the Scope

The user will specify what they want summarized, such as:
- "linkedin module" - summarize the LinkedIn module user journey
- "reddit module" - summarize the Reddit module user journey
- "stripe integration" - summarize how Stripe payments work
- "auth flow" - summarize the authentication system

### 2. Explore the Codebase

Use the Task tool with `subagent_type: Explore` to thoroughly investigate:
- All files related to the scope (components, actions, API routes, hooks)
- Database interactions and metadata fields
- Webhook handlers and external integrations
- User-facing flows and admin functionality
- Status transitions and state management

Be very thorough - you need to understand every aspect of the scope.

### 3. Generate the Summary

Output a user journey summary in this exact format:

```markdown
### User Journey

**Section Name**

- Main point about what happens
- Another key point
    - Sub-detail with more specifics
    - Another sub-detail
- Database updates: what gets stored where
- Key metadata fields or status changes

**Next Section**

- Continue chronologically through the user journey
- Cover setup → configuration → main features → subscription/payment → admin actions → edge cases
```

### Format Guidelines

1. **Title**: Always start with `### User Journey` (H3 header)
2. **Section Headers**: Use bold (`**Section Name**`) for major flow stages
3. **Bullets**: Use `-` for main points
4. **Sub-bullets**: Indent exactly 4 spaces for sub-bullets under a main bullet
4. **Level of Detail**:
   - Include what happens at each step
   - Include key database/metadata updates
   - Include status transitions
   - Do NOT include implementation details like exact API route paths or function names
   - Do NOT include code snippets
5. **Completeness**: Cover the entire scope including:
   - Initial setup/configuration
   - Main user actions and features
   - Admin actions (if applicable)
   - Payment/subscription flows (if applicable)
   - Edge cases and error handling
   - Cleanup/cancellation

### Example Sections to Include (adapt based on scope)

For a module:
- Module Setup
- Configuration/Parsing (if applicable)
- Account Connection (if applicable)
- Subscription & Payment
- Main Feature 1 (e.g., Ideation, Content Generation)
- Main Feature 2
- Post/Content Statuses
- User Actions (approve, delete, edit, etc.)
- Webhook Handling (if applicable)
- Subscription Upgrade
- Subscription Downgrade
- Monthly Renewal
- Subscription Cancellation

### Output

Do NOT change any code. Only output the summary as markdown text that the user can copy.
