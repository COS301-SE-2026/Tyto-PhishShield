# Research: LLM Fallback & LangChain Orchestration

---

## Overview

To ensure high availability, cost efficiency, and resilience, our platform will implement an LLM fallback strategy using LangChain orchestration.

The system will use:

- **Primary Model:** OpenAI GPT-4 (cloud-hosted)
- **Fallback Model:** Llama 3 via Ollama (local/self-hosted)
- **Orchestration Layer:** LangChain (LCEL – LangChain Expression Language)

This architecture allows the platform to automatically switch to a secondary model if the primary model becomes unavailable due to:

- API downtime
- Rate limits
- Invalid/expired API credentials
- Network failures
- Timeout errors
- Exhausted API credits

This ensures the AI simulation engine remains operational even during service disruptions.

---

## 1. Core Concepts

### 1.1 LangChain Orchestration (LCEL)

LangChain uses the LangChain Expression Language (LCEL) to create clean AI pipelines by chaining components together.

A typical pipeline follows:

```
Prompt → LLM → Output Parser → Response
```

Instead of writing deeply nested logic, components are connected using `.pipe()`:

```javascript
prompt.pipe(model).pipe(parser)
```

**Benefits:**
- Cleaner architecture
- Highly modular design
- Easy model swapping
- Better maintainability
- Reduced boilerplate code
- Easy debugging and testing

### 1.2 LLM Fallbacks

LangChain supports automatic failover using `.withFallbacks()`. If the primary LLM fails, LangChain automatically forwards the same prompt to the fallback model.

**Flow:**

```
User Request
      ↓
Primary Model (GPT-4)
      ↓
Success → Return Response
      ↓
Failure
      ↓
Fallback Model (Llama 3 / Ollama)
      ↓
Return Response
```

This process is transparent to the user.

**Benefits:**
- No downtime
- Improved reliability
- Lower operational risk
- Better user experience
- Reduced cloud AI costs

---

## 2. Proposed Architecture

### AI Generation Layer

```
Frontend Request
      ↓
NestJS Backend API
      ↓
LangChain Orchestration Layer
      ↓
Primary LLM (OpenAI GPT-4)
      ↓ (if failed)
Fallback LLM (Llama 3 via Ollama)
      ↓
Output Validation / Sanitisation
      ↓
Return Generated Simulation
```

### Components

#### Primary Cloud Model — OpenAI GPT-4

Used for: high-quality phishing email generation, contextual scenario creation, adaptive security simulations, and nuanced language generation.

| | |
|---|---|
| **Advantages** | Excellent reasoning capability, high output quality, strong prompt adherence, consistent formatting |
| **Disadvantages** | Paid API usage, external dependency, rate limits, network latency |

#### Fallback Local Model — Llama 3 (Ollama)

Used when OpenAI fails.

| | |
|---|---|
| **Advantages** | Zero per-request cost, fully offline capability, no API limits, fast local inference, complete control over deployment |
| **Disadvantages** | Lower output quality than GPT-4, requires local compute resources, more operational maintenance |

---

## 3. Required Dependencies

### Install LangChain packages

```bash
npm install langchain @langchain/core @langchain/openai @langchain/community
```

### Install Ollama

```bash
ollama pull llama3
ollama serve
```

**Default Ollama endpoint:** `http://localhost:11434`

---

## 4. NestJS Implementation

### AI Simulation Service

```typescript
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

@Injectable()
export class AiSimulationService {
  async generatePhishingEmail(scenario: string): Promise<string> {
    // Primary Model
    const primaryModel = new ChatOpenAI({
      modelName: "gpt-4",
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
      timeout: 5000,
    });

    // Fallback Model
    const fallbackModel = new ChatOllama({
      model: "llama3",
      baseUrl: "http://localhost:11434",
      temperature: 0.7,
    });

    // Automatic failover
    const robustModel = primaryModel.withFallbacks({
      fallbacks: [fallbackModel],
    });

    // Prompt template
    const prompt = PromptTemplate.fromTemplate(`
      You are a cybersecurity expert building a simulation.
      Write a short, convincing phishing email based on:
      {scenario}
      Do not include malicious links.
      Use [LINK] as placeholder.
    `);

    const parser = new StringOutputParser();

    const chain = prompt
      .pipe(robustModel)
      .pipe(parser);

    try {
      return await chain.invoke({ scenario });
    } catch (error) {
      throw new Error("Simulation generation temporarily unavailable.");
    }
  }
}
```

---

## 5. Testing the Fallback Mechanism

### Test Procedure

**Step 1** — Run Ollama:

```bash
ollama serve
```

**Step 2** — Set invalid OpenAI credentials:

```env
OPENAI_API_KEY=sk-fake-key
```

**Step 3** — Call endpoint:

```
POST /simulation/generate
```

### Expected Result

```
OpenAI returns: 401 Unauthorized

LangChain detects failure and switches automatically:
GPT-4 → FAILED
      ↓
Llama 3 → SUCCESS
      ↓
Response returned
```

The user receives generated content without interruption.

---

## 6. Additional Enhancements (Recommended)

### 6.1 Logging & Monitoring

Track fallback usage:
- OpenAI success rate
- Fallback activation count
- Response latency
- Generation failures

**Useful tools:** Prometheus, Grafana, Winston Logger

Helps identify: API instability, increased costs, local model overuse, and bottlenecks.

### 6.2 Output Validation Layer

Generated phishing simulations should be filtered to prevent unsafe outputs.

**Checks:**
- No real malicious links
- No executable payloads
- No harmful code snippets
- Placeholder replacement validation

**Example** — use:
```
[LINK]
```
instead of:
```
http://malicious-site.com
```

### 6.3 Response Caching

Repeated prompts can be cached to reduce cost and latency.

**Example:**
- Scenario: `"Fake Microsoft password reset"` → result stored in Redis cache
- Next identical request → cache hit → instant response

**Benefits:** lower API cost, reduced latency, less model load.

### 6.4 Multi-Level Fallback (Future)

Future architecture:

```
GPT-4
  ↓
Claude
  ↓
Gemini
  ↓
Llama 3 Local
```

Provides enterprise-grade redundancy.

### 6.5 Containerisation

Deploy each model connector separately:

- `ai-orchestrator` service
- `ollama` service
- `cache` service
- `monitoring` service

**Benefits:** independent scaling, fault isolation, easier maintenance.

---

## 7. Benefits for Our Project

| Benefit | Detail |
|---|---|
| **Reliability** | System remains operational even when OpenAI fails |
| **Cost Efficiency** | Cloud usage minimized |
| **Scalability** | Easy to add more providers |
| **Modularity** | Model providers interchangeable |
| **Security** | Sensitive prompts can remain on local infrastructure |
| **Academic Strength** | Demonstrates distributed systems thinking, resilience engineering, microservice architecture, failover design, AI orchestration, and practical enterprise implementation |

---

## Conclusion

Using LangChain orchestration with automatic LLM fallback provides a robust AI architecture that ensures:

- Reliability
- Lower operational cost
- Modularity
- Scalability
- Offline capability
- Enterprise-grade resilience

This makes it an ideal architectural choice for the phishing simulation platform.
