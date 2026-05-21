# Research: Authentication & Authorization
## Auth0 vs Firebase for Tyto PhishShield

---

## Overview

For Tyto PhishShield, authentication and authorization must support:

- Role-Based Access Control (RBAC)
- Microsoft Outlook Single Sign-On (SSO)
- Secure JWT authentication
- Low-latency authorization checks
- Enterprise-grade identity management
- Scalable user provisioning
- Zero / low operational cost

After evaluating available authentication providers, **Auth0 is the preferred solution.**

---

## 1. Technology Comparison: Auth0 vs Firebase

### 1.1 Role-Based Access Control (RBAC)

#### Firebase

Firebase does not provide a complete RBAC system out of the box. Role management requires:

- Creating custom claims
- Writing backend functions
- Manually attaching roles to users
- Custom role lifecycle management
- Additional security logic in application code

Example roles: `Admin`, `Analyst`, `User`

**Limitations:**
- More development overhead
- Custom infrastructure required
- Harder to audit
- Harder to scale securely
- Limited enterprise access management tooling

#### Auth0

Auth0 provides native RBAC support through its dashboard. Administrators can:

- Create roles
- Define permissions
- Assign roles to users
- Manage user access centrally
- Audit permission changes

**Example role model:**

| Role    | Permissions               |
|---------|---------------------------|
| Admin   | Full system access        |
| Analyst | View reports / metrics    |
| User    | Participate in simulations|

**Advantages:**
- Built-in RBAC
- Easy administration
- Secure defaults
- Scalable
- Enterprise-ready
- Minimal backend complexity

---

### 1.2 Microsoft Outlook Single Sign-On (SSO)

#### Firebase

Firebase supports Microsoft login, but is primarily optimized for:

- Mobile apps
- Consumer-facing applications
- Lightweight OAuth login flows

**Limitations:**
- Limited enterprise federation support
- Weaker integration with Microsoft identity ecosystems
- More manual configuration

#### Auth0

Auth0 supports Enterprise Connections directly with:

- Microsoft Entra ID (Azure AD)
- SAML
- OpenID Connect
- OAuth2

This allows:
- Seamless corporate login
- Centralized identity management
- Existing enterprise credential reuse
- MFA support
- Corporate security policy enforcement

**Benefits for Outlook Add-In:**

Employees can authenticate using existing organizational Microsoft credentials.

**Flow:**
```
Outlook Add-in
      ↓
Microsoft Login
      ↓
Auth0 Identity Broker
      ↓
JWT Token Issued
      ↓
NestJS API Access
```

---

### 1.3 Cost Comparison

#### Auth0 Free Tier Includes:

- Up to 7,500 monthly active users
- RBAC support
- Social + enterprise login
- MFA support
- Token issuance
- Audit logs
- Secure identity platform

**Project requirement:** 500 concurrent users — comfortably fits within free tier constraints.

> **Verdict: Meets project budget**

---

## 2. Final Technology Decision

**Selected Authentication Platform: Auth0**

**Reasons:**
- Built-in RBAC
- Enterprise SSO support
- Microsoft integration
- Secure JWT ecosystem
- Minimal backend complexity
- Scalable architecture
- Auditability
- Fast implementation

---

## 3. Authentication & Authorization Architecture

### High-Level Flow

```
User Login (React / Outlook Add-in)
      ↓
Auth0 Authentication
      ↓
Microsoft Entra ID SSO
      ↓
User Verified
      ↓
Auth0 Action executes
      ↓
Role claims injected into JWT
      ↓
JWT returned to client
      ↓
Client calls NestJS API
      ↓
NestJS validates JWT signature
      ↓
RBAC Guard checks permissions
      ↓
Access Granted / Denied
```

### Benefits

#### Stateless Authorization
No database lookup required per request — role proof exists directly inside the JWT.

- Lower latency
- Fewer DB queries
- Easier scaling
- Simpler backend design

#### Cryptographic Trust
JWT signed with RS256. NestJS validates using Auth0 public keys (JWKS), guaranteeing:

- Token authenticity
- Token integrity
- Tamper protection

---

## 4. Auth0 Token Enrichment (Custom Claims)

Auth0 Actions can inject user roles directly into issued tokens.

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://phishshield.tyto.com";
  if (event.authorization) {
    api.accessToken.setCustomClaim(
      `${namespace}/roles`,
      event.authorization.roles
    );
    api.idToken.setCustomClaim(
      `${namespace}/roles`,
      event.authorization.roles
    );
  }
};
```

**Example JWT Payload:**

```json
{
  "sub": "auth0|12345",
  "name": "John Doe",
  "email": "john@company.com",
  "https://phishshield.tyto.com/roles": [
    "Admin"
  ]
}
```

NestJS reads this claim directly — no database role lookup required.

---

## 5. NestJS JWT Validation

### Dependencies

```bash
npm install @nestjs/passport passport passport-jwt jwks-rsa
npm install @types/passport-jwt --save-dev
```

### JWT Strategy

```typescript
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    });
  }

  validate(payload: any) {
    return payload;
  }
}
```

---

## 6. Role Guard Implementation

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      "roles",
      [
        context.getHandler(),
        context.getClass(),
      ]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const namespace = "https://phishshield.tyto.com/roles";
    const userRoles = user[namespace] || [];

    return requiredRoles.some(role => userRoles.includes(role));
  }
}
```

---

## 7. Securing Endpoints

### Example Controller

```typescript
import {
  Controller,
  Post,
  UseGuards,
  SetMetadata
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "./roles.guard";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

@Controller("campaigns")
export class CampaignController {

  @Post("schedule")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin")
  scheduleCampaign() {
    return { message: "Campaign scheduled" };
  }

  @Post("metrics")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("Admin", "Analyst")
  getMetrics() {
    return { message: "Metrics returned" };
  }
}
```

---

## 8. Additional Security Considerations (Recommended)

### Multi-Factor Authentication (MFA)

Auth0 supports:
- Authenticator apps
- SMS verification
- Email verification
- WebAuthn / passkeys

> Recommended for: `Admin`, `Analyst`

### Least Privilege Access

Users should receive only permissions necessary for their role.

**Example — `User` role:**
- Can View training
- Can Submit reports
- Cannot Schedule campaigns
- Cannot View organizational metrics

### Audit Logging

Log the following events:
- Logins
- Failed login attempts
- Role changes
- Permission changes
- Privileged endpoint access

Useful for: compliance, incident investigation, threat monitoring.

### Secret Management

**Never store** in source code:
- Auth0 secrets
- API keys
- Signing secrets

**Use environment variables:**
```env
AUTH0_DOMAIN=
AUTH0_AUDIENCE=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
```

**Store securely via:**
- Docker secrets
- Kubernetes secrets
- Vault
- CI/CD secret manager

### Token Expiry & Refresh

Use short-lived access tokens (e.g. **15 minutes**), and refresh securely using refresh tokens.

**Benefits:**
- Reduced stolen-token risk
- Better session security

---

## 9. Why This Architecture Fits PhishShield

| Quality        | Detail                                          |
|----------------|-------------------------------------------------|
| **Fast**       | Authorization checks are near-instant           |
| **Secure**     | Enterprise-grade identity provider              |
| **Scalable**   | Works for hundreds or thousands of users        |
| **Maintainable** | Minimal custom authentication code           |
| **Enterprise Ready** | Supports Outlook SSO, RBAC, MFA, auditing, secure JWT verification |

---

## Conclusion

Auth0 is the preferred authentication and authorization platform for Tyto PhishShield. It provides:

- Enterprise SSO
- RBAC
- JWT security
- Scalability
- Low-latency authorization
- MFA support
- Auditability
- Minimal implementation complexity

This makes it the strongest architectural choice for the platform.
