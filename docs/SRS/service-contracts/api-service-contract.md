# PhishShield API Service Contract

**Version:** 1.0.0  
**Status:** Agreed  
**Date:** 2026-09-01

## 1. Introduction

Our Phishshield app will expose a REST API that will be used by the web frontend, Outlook add-in and any other external services.

In this document the service contract between the frontend and backend is described so that they can work in paralel. This includes athentication, endpoint definitions, request/response schemas and error handling.

> **Important:** All changes made to openapi.yaml must be discussed with both teams and both teams have to agree. Any changes must be indicated by changing the version.

## 2. Environments

| Environment | Base URL |
|---|---|
| Staging | `https://capstone-five-guys.dns.net.za/staging` |
| Production | `https://capstone-five-guys.dns.net.za/production` |
| Local Development | `http://localhost:3001` |

## 3. Authentication & Authorization

For protected endpoints, a valid JWT token issued by Auth0 is necessary.

The token should be in the `Authorization` header.

```http
Authorization: Bearer <JWT>
```

Roles (`admin`, `analyst`, `user`) are passed as the custom claim in `https://phishshield/roles`.

Public endpoints are deined using the following flag:

```yaml
security: []
```

## 4. Standard Error Format

Error responses will always use the following structure:

```json
{
  "statusCode": 400,
  "message": "Human readable error message",
  "error": "Bad Request"
}
```

## 5. OpenAPI Specification
The full machine‑readable OpenAPI contract is available in the repository at:

[`openapi.yaml`](./openapi.yaml)