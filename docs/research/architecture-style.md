### Service Oriented Architecture (SOA)
![[soa_api_gateway_architecture.svg|697]]
#### How the event bus enables inter-service communication
The core idea is the **publish-subscribe pattern** (pub/sub). Rather than Service A directly calling Service B, both services talk through the bus:

- A **publisher** emits an event when something happens: `order.placed`, `payment.failed`, `user.registered`. It doesn't know or care who receives it.
- The **event bus** stores the event in a named **topic** (Kafka) or **queue** (RabbitMQ) and ensures it gets delivered.
- A **subscriber** declares interest in a topic. Whenever a matching event arrives, the bus delivers a copy to it.
#### What makes this powerful in SOA
The key benefit is **temporal and logical decoupling**. Services don't need to be online at the same time — if Notifications goes down, the bus holds its events in the queue until it recovers. And they don't need to know anything about each other — you can add a new subscriber (e.g. a Fraud Detection service) to the `order.placed` topic without touching the Order service at all.
#### Synchronous vs asynchronous

Not all service communication goes through the bus. When a service needs an immediate answer — like checking a user's account balance before approving a transaction — it uses a synchronous call (REST or gRPC) directly between services. The event bus handles the cases where services only need to react eventually and don't need a response: sending confirmation emails, updating a search index, triggering a shipment, recording analytics, and so on. A well-designed SOA uses both patterns where each fits best.
#### The API Gateway as the system's front door

The gateway is the single entry point for all client traffic. Every request — from a browser, mobile app, or third-party integration — flows through it before touching any backend service. This is what makes it so powerful: instead of every service independently solving the same cross-cutting problems (auth, logging, rate limiting), the gateway solves them once, consistently, for the entire system.

The 10 responsibilities in the widget fall into four natural groups:

**Security** — Authentication, authorisation, SSL termination, and rate limiting ensure that only valid, permitted, non-abusive requests ever reach your services.

**Traffic management** — Routing, load balancing, circuit breaking, and retries ensure requests reach the right service, get distributed evenly, and fail gracefully when something goes wrong.

**Performance** — Caching reduces backend load for repeated reads, and request aggregation lets clients fetch composed data in a single round trip instead of many.

**Observability & governance** — Centralised logging, distributed tracing, metrics, and API versioning give you full visibility into what's happening across all services and a controlled way to evolve them over time.

### Microservices Architecture
![[microservices_api_gateway_architecture.svg|697]]
#### What is microservices architecture?

Microservices is an architectural style where an application is split into a collection of small, independently deployable services. Each service is built around a single business capability, runs in its own process, and communicates with others over lightweight protocols like REST, gRPC, or asynchronous messaging.
#### How to design it
**1. Decompose by business domain.** Each service owns one domain — User, Order, Payment, Notifications, etc. A good rule of thumb is the "single responsibility principle" applied at the service level: if you can't describe what the service does in one sentence, it's probably doing too much.

**2. API Gateway as the front door.** All client traffic enters through the gateway. It handles cross-cutting concerns so your services don't have to:

- JWT/OAuth authentication and authorisation
- SSL/TLS termination
- Rate limiting and throttling
- Request routing to the correct downstream service
- Load balancing across multiple service instances
- Request aggregation (combining responses from multiple services into one)

Popular gateway tools include Kong, AWS API Gateway, NGINX, and Traefik.

**3. Service-to-service communication.** Services talk to each other in two ways:

- Synchronous (solid arrows in the diagram) — direct HTTP/REST or gRPC calls when an immediate response is needed (e.g. Order service calling Payment service during checkout).
- Asynchronous (dashed arrows) — events published to a message bus (Kafka, RabbitMQ) when services only need to react eventually (e.g. Order service emitting an `order.placed` event that Notifications picks up to send a confirmation email).

**4. Database per service.** Each service owns its own database and no other service can query it directly. This enforces loose coupling and lets each team choose the best database technology for their workload (relational, document, cache, etc.).

**5. Service mesh for internal networking.** A service mesh (Istio, Linkerd) sits between services to handle retries, circuit breaking, mutual TLS, and observability — without any of that logic living inside the service code itself.

**6. Containerisation and orchestration.** Each microservice is packaged as a Docker container and deployed via Kubernetes, which handles scaling, health checks, and zero-downtime rolling deployments.
#### Advantages

- **Independent deployability.** Teams can deploy any service without coordinating with others — enabling faster release cycles.
- **Independent scalability.** You can scale only the services under load (e.g. scale the Payment service during a sale without touching everything else).
- **Technology flexibility.** Each service can be written in a different language or use a different database — pick the right tool for the job.
- **Fault isolation.** A crashed service doesn't bring down the whole application. Circuit breakers prevent cascading failures.
- **Team autonomy.** Small, cross-functional teams own and operate their service end-to-end, reducing bottlenecks.
- **Easier to understand individually.** Each service is small and focused, making its own codebase manageable.
#### Disadvantages

- **Distributed system complexity.** Network calls fail, latency is unpredictable, and you now have to handle partial failures, retries, and timeouts everywhere.
- **Operational overhead.** You need container orchestration, a service mesh, centralised logging, distributed tracing, and a secrets manager just to run the thing reliably.
- **Data consistency challenges.** With no shared database, keeping data consistent across services requires patterns like Sagas or eventual consistency — much harder than a database transaction.
- **Inter-service latency.** What used to be a function call inside a monolith is now a network hop. Chains of synchronous service calls compound latency.
- **Testing complexity.** Integration and end-to-end tests require spinning up multiple services, making local development and CI pipelines heavier.
- **API versioning burden.** When one service changes its API, every consumer needs to be coordinated, versioned, or kept backwards-compatible.
- **Overkill for small teams.** The overhead of this architecture is significant — small applications or teams rarely see enough benefit to justify the cost.
### Event bus
The event bus lets microservices communicate by publishing events to a shared broker rather than calling each other directly — decoupling them in time, location, and knowledge of each other.
#### Why it matters in microservices specifically
In a monolith, a function call is instantaneous and in-memory — failure is rare and coupling is invisible. In microservices, every direct service call is a network request that can fail, timeout, or cascade. The event bus removes this fragility in three ways.
First, **temporal decoupling** — the publisher doesn't wait for consumers. It fires the event and moves on. If Payment service is down for 10 minutes, the event sits safely in the bus and gets processed when it recovers. The Order service never knew there was a problem.
Second, **spatial decoupling** — the publisher doesn't need to know where consumers are, how many instances they're running, or even which services exist. You can add a new Fraud Detection service that subscribes to `order.placed` tomorrow, and the Order service needs zero changes.
Third, **durability** — unlike a direct HTTP call where a dropped connection loses the request, the event bus writes events to disk and replicates them. Events survive broker restarts, network blips, and consumer crashes.