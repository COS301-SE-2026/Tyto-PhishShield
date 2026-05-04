# Meeting Notes: 02/05/2026
## GitHub Project Board Tasks

---

## 1. Office.js API Capabilities and Outlook Add-in Lifecycle

### What is Office.js?

Office.js is Microsoft's JavaScript API for extending Microsoft Office apps (Outlook, Word, Excel, etc.).

### Ribbon Button

A button on the ribbon is supported via **command surface add-ins**. When clicked, the following data fields are accessible:

| Field | API |
|---|---|
| Subject | `Office.context.mailbox.item.subject` |
| Sender email | `Office.context.mailbox.item.from.emailAddress` |
| Recipients | `item.to` |
| Body preview | `item.body.getAsync(...)` |
| Message ID | `item.internetMessageId` |
| Date created | `item.dateTimeCreated` |

### Sending Data to Backend

```javascript
fetch("https://api.phishshield.com/report", {
  method: "POST",
  body: JSON.stringify(data)
});
```

### Toast Notifications

Supported via `notificationMessages`:

```javascript
Office.context.mailbox.item.notificationMessages.replaceAsync(
  "success",
  {
    type: "informationalMessage",
    message: "Email reported successfully.",
    icon: "icon16",
    persistent: false
  }
);
```

### Limitations

- **Mobile** — mobile add-ins support fewer features than desktop/web. If required, keep mobile interaction simple (single-click report).
- **Security restrictions** — Office.js runs in a sandbox environment (no access to the full local system, no arbitrary OS access — this is actually good for security).

### Add-in Lifecycle

1. User installs add-in (admin deploys centrally via Microsoft 365 Admin Centre)
2. Outlook loads `manifest.xml` (defines name, icons, commands, permissions, URLs, etc.)
3. User opens email (Outlook checks if add-in applies to message context)
4. Ribbon button appears
5. User clicks button → triggers JavaScript event:
   ```javascript
   function reportEmail(event) {
     // ... handle report
     event.completed();
   }
   ```
6. Backend processes report (NestJS — logs report, awards XP if correct, checks if simulation, returns result)
7. Feedback shown (toast / teachable moment / task pane)

### SpamReporting Event (from Microsoft Build)

> References:
> - https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/apis
> - https://learn.microsoft.com/en-us/javascript/api/outlook/office.spamreportingeventargs?view=outlook-js-preview

```javascript
// Handles a SpamReporting event to process a reported spam or phishing message.
function onSpamReport(event) {
  if (event.type === "SpamReporting") {
    const reportedOptions = event.options;
    const additionalInfo = event.freeText;

    // Run additional processing operations here.

    // Signal that the event has completed processing.
    event.completed({
      moveItemTo: Office.MailboxEnums.MoveSpamItemTo.CustomFolder,
      folderName: "Reported Messages",
      onErrorDeleteItem: true,
      showPostProcessingDialog: {
        title: "Contoso Spam Reporting",
        description: "Thank you for reporting this message."
      }
    });
  }
}
```

**SpamReportingEventArgs properties:**

| Property | Description |
|---|---|
| `freeText` | Text provided by the user in the preprocessing dialog |
| `options` | Returns `true` for each reporting option selected by the user |
| `type` | The type of event that was raised (see `Office.EventType`) |

### Architecture Consideration: Service-Based Monolith

A service-based monolith is a viable option for our use case:

- One backend with internal modules: Auth, Campaign, Reporting, Gamification, AI
- Office.js frontend only talks to one API → simpler deployment, easier debugging, easier auth
- Stack: `Frontend Add-in → NestJS API → PostgreSQL`

**Architecture comparison:**

| | Monolithic | Service-Oriented | Microservices |
|---|---|---|---|
| Codebase | Single | Collection of services | Collection of independent services |
| Coupling | Tightly coupled | Loosely coupled | Highly coupled (between services) |
| Deployment | Single | Individual deployments possible | Independent deployment |
| Scalability | Limited | Service-based | Fine-grained |
| Complexity | Simple initially, can grow complex | Moderate | Higher management complexity |

> **Note:** The tight coupling of a monolith is a concern if we later want to grow or expand the system.

> Reference: https://www.geeksforgeeks.org/system-design/monolithic-vs-service-oriented-vs-microservice-architecture/

---

## 2. Tailwind CSS

Tailwind is a **utility-first CSS framework** and an excellent choice for this project.

**Instead of:**
```css
button { padding: 12px; background: blue; }
```

**Use:**
```html
<button class="px-4 py-2 bg-blue-600 rounded text-white">
```

**Benefits:** fast UI building, consistent design, responsive dashboard, dark mode support.

### Example Component

```html
<div class="bg-white shadow rounded-xl p-6">
  <h2 class="text-xl font-bold">XP Score</h2>
  <p class="text-3xl text-blue-600">1420</p>
</div>
```

### Recommended Stack

- **Tailwind CSS** — styling
- **Headless UI / shadcn/ui** — accessible components
- **Recharts** — graphs and data visualisation

### How Tailwind Works

Tailwind scans all HTML files, JavaScript components, and templates for class names, generates the corresponding styles, and writes them to a static CSS file.

> References:
> - https://tailwindcss.com/docs/installation/using-vite
> - https://tailwindcss.com/docs/compatibility

---

## 3. Auth0 vs Firebase — RBAC and Outlook SSO

### Auth0 (Identity-as-a-Service)

- Better RBAC out of the box (built-in roles: `admin`, `analyst`, `user`; assign permissions directly)
- Better enterprise SSO
- Easier Azure AD / Microsoft Entra ID integration
- Better token/permission management (backend receives secure JWTs; works with NestJS Guards)
- More professional for B2B clients
- Cost to be confirmed

### Firebase (Google's Authentication System)

- Faster setup
- Easy frontend integration
- Good free tier
- Great for prototypes (custom tokens)
- Roles must be simulated via custom claims; backend then checks claim manually

### Auth0 Outlook SSO Flow

```
Outlook User Logged In
        ↓
Add-in Opens
        ↓
Acquire Microsoft Identity Token
        ↓
Auth0 validates / exchanges
        ↓
Backend receives JWT with roles
```

### Verdict

Auth0 is the stronger choice for this project given the enterprise SSO requirements and need for proper RBAC. See the dedicated Auth0 vs Firebase research document for full implementation details.
