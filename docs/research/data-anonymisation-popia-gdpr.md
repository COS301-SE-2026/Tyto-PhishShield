# Data Anonymisation & POPIA/GDPR Compliance

## Why this is important

The Tyto PhishShield system processes user behavioural data such as phishing reports, click behaviour, XP updates, and campaign results. According to project requirements, all user behavioural data must be anonymisable.

Additionally, the system must scrub sensitive data before sending any content to external AI APIs.

This makes compliance with privacy regulations such as POPIA and GDPR essential.

---

## What is POPIA and GDPR?

### POPIA (South Africa)
The Protection of Personal Information Act (POPIA) regulates how personal information is collected, processed, and stored in South Africa.

POPIA applies to:
- Natural persons (individuals)
- Juristic persons (companies and organisations)

### GDPR (Europe)
The General Data Protection Regulation (GDPR) is a European regulation focused on protecting personal data of individuals.

---

## Key difference

POPIA and GDPR are similar in that both regulate personal data and require it to be protected. However:

- GDPR applies mainly to individuals (natural persons)
- POPIA applies to both individuals and organisations (juristic persons)

---

## What counts as personal data?

Under POPIA, personal information includes:

- Name and surname
- Email address
- Phone number
- Employment information
- Education history
- Financial, medical, or criminal data
- Biometric information

In the context of PhishShield, personal data may include:

- User email and identity (Auth0/Firebase)
- Reported email content (may contain personal info)
- Department and role information

---

## Anonymisation vs Pseudonymisation

### Pseudonymisation
- Replacing identifiers with fake values (e.g. "User1")
- Still reversible if additional data exists
- Still considered personal data under GDPR/POPIA

### Anonymisation
- Data cannot be linked back to a person
- Irreversible
- Not considered personal data anymore

> Important: Using pseudonyms alone is NOT enough for compliance.

---

## Design approach for our system

### 1. Separate PII from behavioural data

In our system, personal user data (e.g. name, email, Auth0 ID) should be stored in a separate database table from behavioural analytics (e.g. report actions, XP changes, campaign results).

This ensures that analytics can run on anonymised or pseudonymised data, while still allowing controlled access when necessary.

Example:
- users
    - user_id
    - name
    - email
    - department
    - role

- analytics_events
    - event_id
    - pseudonymous_user_id
    - event_type
    - result
    - xp_change
    - timestamp

These tables should only be joined in the backend when required.

---

### 2. Access control for sensitive data

Only Admins and Analysts should be able to view data for specific individuals.

- Admin/Analyst:
  - Can view individual performance and vulnerability
- Normal users:
  - Can only view their own data
  - Can view aggregated department data

This should be enforced using Role-Based Access Control (RBAC) in the backend.

---

### 3. Redact data before sending to AI

Sensitive data must be removed before sending any content to external AI services.

For the MVP:
- Use Regex-based sanitisation

For later improvement:
- Use Microsoft Presidio for more advanced detection

---

## Tools and techniques

### 1. Microsoft Presidio

Microsoft Presidio is an open-source tool used to detect and anonymise personal data using natural language processing.

- It is free and open-source(MIT license)
- Automatically detects personal data such as:
  - names
  - emails
  - phone numbers
  - locations
- Allows us to:
  - redact → [PERSON]
  - mask → N***
  - replace → [EMAIL]

In our system, Presidio would run as a separate Python-based microservice that the NestJS backend can call before sending data to external AI services.

We may choose to integrate Presidio after the MVP phase to improve anonymisation accuracy.

### 2. Regex (MVP approach)

Regex (Regular Expressions) can be used to detect and replace structured patterns such as:

- Email addresses
- Phone numbers
- URLs

#### Example (TypeScript)

```ts
const text: string = "Contact me at nico@gmail.com or visit https://example.com";

// Regex patterns
const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Apply redaction
let redacted = text.replace(emailRegex, "[EMAIL]");
redacted = redacted.replace(urlRegex, "[URL]");

console.log(redacted);
// Output: Contact me at [EMAIL] or visit [URL]