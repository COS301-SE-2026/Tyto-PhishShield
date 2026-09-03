# Software Architecture Specification

## Introduction
The Software Architecture Specification (SAS) document creates a formal guide to satisfy the Software Requirments Specification (SRS) document. 

- The architectural requirments section covers the high-level structure of the system.
- The Technology requirements section outlines the technologies used to implement the system.
- The api-service contracts defines the contracts used to communicate between frontend and backend systems.
- The deployment section covers how the system is deployed.

## Architectural Requirements

### Architecture Patterns
The Tyto-PhishShield system consists of three parts namely: The client side, the microservices and the event system.<br>
#### Client-Server
The first level of the architecture is that we use a Client-Server architecture where the clients will communicate to the servers through the API gateway. On the client side, clients will use a request response model to communicate with the API gateway. Everything after the API gateway will form the server side of the architecture. 

Responsibilbity:<br>
API gateway is responsible for receiving client requests, authenticating clients and doing roll-based authentication control. The API gateway then routes user traffic to the correct microservice to handle user business logic.
#### Microservices
Microservices is used to handle each business goal of the system. The API gateway handles routing and dividing of user requests to the correct service in order to isolate business logic and create a modular and scalable platform. The API gateway will use a request response model for communicating with the Microservices. Each Microservice has its own database and handles its own methodes for communicating with the api-gateway and over the event queues.

Responsibilbity:<br>
Each microservice is self contained and receives requests from the API gateway. The microservice will handle business logic based on its definition and will also handle it's own transactions with its own database. A microservice may also send an event with data attached (a message) to the event system if other business logic needs to be accomplished but is not within the scope of the microservice.
#### Event Driven Pattern
An Event Driven pattern is used in the event system to handle communication between services. Some services are publishers while others are subscribers, some may be both as well. In this way services can be kept independent of one another and eventually still be consistent with one another.

Responsiblity:<br>
The event system contains multiple event queues in which an event being processed by the system can attach messages to a given queue and send out the messages to the correct microservice which is subscribed to a specific queue. 

Thus in using these architectural patterns the system essentially uses Event Driven Microservices as its official architectural pattern.

### Architecture Diagram
![Architecture Diagram](<../images/Architecture Diagram.png>)

### Design Patterns
Analyzing the system on a design level we can point out the usage of a few design patterns:<br>
#### Facade
Firstly the API gateway acts as a facade, creating an interface through which the rest of the system can be used. This improves maintainability since we make use of one entry point through which requests enter into the system which is easier to maintain than having multiple entry points.<br>

#### Mediator
The Event Driven System acts as a mediator for the services. The Event Driven System can have multiple event exchanges through which services can receive and send different types of event messages and handle some system logic on the backend. This improves flexibility allowing system logic to be handled independently by separate services.

#### Publish Subscribe
Microservices each handle their own methods of communication. The only dependency is to know on which express queue they can recieve their data that they may be interested in. In this way the Microservices form a publish subscribe pattern where some services are subscribers and others are publishers and some are both just on different express queues.

### Constraints 
 1. The system must run on a single server.
 2. Any technologies used should be free and open source.
 3. POPIA & GDPR compliance required.
 4. Build native Outlook Add-in (Office JS API).
 5. API authenticates all enpoints before anything reaches the services.
 6. Each Microservice's database is its own and may not be accessed by another.

### Quality Requirements based off of [NFR](./Software_Requirements_Specification.md#non-functional-requirements)

#### NFR 1 Quality attribute: Security
1. The system must reject 100% or requests to protected API endpoints that do not have valid or expired authentication tokens.
2. The system must enforce that 100% of the protected API endpoints can only be accessed by users with an appropriate role.

**Tactic:** Use RBAC in the API gateway, use authorization tokens.

**Pattern:** Centralized API gateway authentication pattern.

**ADR-01** Users authenticated for protect endpoints 
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| Only authenticated users should be able to have access to the system.| Use Auth0 for all authorization requests. | No authentication is done in individual microservices, it is only done in the API gateway. Thus all requests have to go to the API gateway first and it should not be possible to send a request directly to a microservice. |

**ADR-02** RBAC for protect endpoints 
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| Users have specific roles and should only have access to what their role is meant to have access to. | Apply RBAC at the API gateway with Auth0. Use Auth0 for all authorization requests. | No RBAC is applied in individual microservices, it is only applied in the API gateway. Thus all requests have to go to the API gateway first and it should not be possible to send a request directly to a microservice. |

**NRF Test:** 
- Test that only HTTPS requests work. 
- Test that unauthorized user roles do not have access to protected API endpoints.
- Test that users with invalid authentication tokens do not have access to protected API endpoints.

**HTTPS Request**
![HTTPS Request returning success](./img/https-authorized-img.png)
This image shows a valid request using HTTPS that returns successful.

#### NFR 2 Quality attribute: Performance
1. The system shall handle XP transactions and leader board updates within **500ms** of user action.
2. The system shall load “Teachable moment” screens within **1s** of clicking a link on a phishing email.
3. The admin dashboard shall update live analytics and leaderboard data within **3 seconds** of receiving new event data through WebSocket communication.
4. The system must maintain a server error rate of less than 0.1% when subjected to a load up to 500 concurrent users.
5. The system must maintain a 95th percentile response time of under 3 second for all API requests when subjected to a load up to 500 concurrent users.

**Tactic:** Spread the load accross 2 API gateway instances, make use of caching for non-live reads, optimize database indexing.

**Pattern:** Add a load balancer to balance requests between two API gateways. 

**ADR-03** Load balancer for API gateway traffic
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| Many requests for different services need to pass through the API gateway. Response time needs to be optimal according the the measures in the quality attribute. | Add a second API gateway instance and use a load balancer to spread the load. | Increases the complexity of the system and adds a bit of latancy. |

**NRF Test:** 
- Test system responsiveness with 500 concurrent users. 
- Test that the response time is within 1s.

**500 Concurrent Users**
![Screenshot of server maintaining efficiency with 500 concurrent users](./img/500-concurrent-users-diagram.png)

In this image you can see a test ran using 500 virtual users sending 266700 requests over a time period of 10min to the staging server. Two GET requests where sent namely, /xp and the loading of the landing page, since they are the most used endpoints for normal users. 0% Errors and 0% Failures where achieved with a 95th percentile response time of 1,381 second.

#### NFR 3 Quality attribute: Portability and Compatibility
1. The system’s admin dashboard shall support standard desktop resolutions and maintain usability across commonly used screen sizes including **resolutions from 1280px to 1920px+ .** 
2. The system’s “report phish” button must appear on the **Outlook ribbon on Desktop, Web, and Mobile.**
3. The platform shall be deployable on **Ubuntu Server environments** using Docker and Docker Compose without requiring platform-specific modifications.

**Tactic:** Use Infrastructure as Code (IaC) and containerisation, use multiplatform design for frontend systems.

**Pattern:** Use docker and docker compose, use tailwind css to handle resolution scaling.

**ADR-04** Containerise all services
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| System should be deployable on any ubuntu server environment. | Create a docker container for each service in the system | Running many containers on a server may use up server resources but limits can be added to ensure the system runs efficiently. |

**NRF Test:** 
- System is deployable on ubuntu servers.
- Frontend design scales well on large screens and the report button can be used on multiple devices.

#### NFR 4 Quality attribute: Usability
1. The system’s “report phish” button must follow the **Microsoft Fluent UI design system.**
2. The system shall comply with **WCAG 2.1 AA accessibility** guidelines for all user-facing dashboards and interfaces.
3. The system shall provide **immediate visual feedback** for all critical user actions including reporting phishing emails, completing simulations, and earning XP rewards.

**NRF Test:** 
- WCAG 2.1 AA accessibility compliance

#### NFR 5 Quality attribute: Reliability and Availability
1. The system must have 99.9% uptime.

**Tactic:** Remove single points of failure, log requests, error exception communication.

**Pattern:** Load balancing, log at load balancer, add a LLM gateway.

**ADR-05** LLM gateway
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| Should an external LLM be unavailable the system should still be able to operate and generate emails. | Add an LLM gateway to route requests to available LLMs. | Introduces extra overhead to system and can degrade performance. |

*For load balancing see ADR-03.

**NRF Test:** 
- Uptime checks should yield >99.9% uptime.
- LLM service responds to requests even if a model is not working anymore.

#### NFR 6 Quality attribute: Flexibility:
1. The system must be able to scale up to 500 concurrent users without any of the core services becoming unresponsive. 

**Tactic:** Spread the load accross multiple independent services.

**Pattern:** Microservices

**ADR-07** Microservices
|**Context**|**Decision**|**Consquences**|
|---|---|---|
| System must be able to scale well and handle 500 concurrent users. | Use microservices to spread requests between many independent services. | Introduces increased complexity to the system. |


**NRF Test:** 
- .

#### NFR 7 Quality attribute: Maintainability
1. The system shall make use of the microservices architecture to increase the maintainability of each subsystem.
2. The complete application stack shall be fully containerized using Docker and orchestrated through Docker Compose for deployment handoff.
3. All backend endpoints shall be documented using OpenAPI 3.0 documentation standards.
4. The CI/CD pipeline shall automatically execute unit and integration tests on every push to the main development branches through GitHub Actions.
5. The system shall achieve a minimum automated backend test coverage of 80%.The system shall achieve a minimum automated backend test coverage of 80%.

**NRF Test:** 
- CI/CD pipeline tests pass.
- Code coverage of 80% is reached.

 <!-- 1. Flexibility: See [NFR 6](./Software_Requirements_Specification.md#non-functional-requirements)

	Adaptable:<br>
	The system should be adaptable so that through out the development of the platform new subsystems can easily be added and updated by swapping out a certain microservice. This can be measured by checking:<br>
	- high code modularity
	- loose coupling between services
	- ensuring the code is self documented and readable

	Scalable:<br>
	The system must be horizontally scalable to handle a minimum of 500 concurrent users. This can be measured by checking:<br>
	- concurrent connection requests
	- testing increasing connection requests

	Architectural Decision:<br>
	- Use microservices to suport adaptable  development.
	- Use a load balancer to balance requests between multiple instances of the api-gateway. -->

 <!-- 2. Maintainability: See [NFR 7](./Software_Requirements_Specification.md#non-functional-requirements)

	It is important for the system to be maintainable so that through out the development process and during handover it will be possible for anyone to maintain the life time of the system. It is also important that business operation are not disrupted during the life time of the platform. -->

 <!-- 3. Performance Efficiency: See [NFR 2](./Software_Requirements_Specification.md#non-functional-requirements)

	Performance of the system is important to maintain the live updates of statistics. This can be measured by checking:
	- the number of requests handled per second
	- the average response time for requests

	Quantification:
	- requests all take less than 1s
	- handle 500 requests per second

	Architectural Descision:
	- 
	- 
	- Asyncronise backround processing -->

 <!-- 4. Reliability: See See [NFR 5](./Software_Requirements_Specification.md#non-functional-requirements)
	
	The system should be reliable and maintain a high uptime. In any event of a failure with an LLM the system should fallback to another model.

	Quantification:
	- ensuring a 99.9% uptime
	- making sure the system can quickly recover from any failures within 30s

	Architectural descision:
	- Make use of a load balancer and spin up multiple instances of the api-gateway. Balance requests between the instances.
	- Add restart mechanisms to all services. -->

 <!-- 6. Auditability:

	The system should be auditable to comply with POPIA and GDPR laws. It also allows any faults to be found and understood. This can be checked by:
	- error logs, application logs, access logs
	- adding granular logging abilities to traceback activity

 7. Functional suitability: 

	The system must be functionally suitable, meaning the system must be tested for logical errors. All functions and operations must be tested with unit and integration tests. Code coverage should be above 80%. This can be measured by checking:
	- automation of unit tests on GitHub actions
	- the build status of the system
	- the code testing coverage  -->

 <!-- 8. Interaction capability: See [NFR 4](./Software_Requirements_Specification.md#non-functional-requirements)

	The system must be usable and easy to interact with. Employees should not need to be trained on how to use the system. The system must be intuitive providing good user experience. This can be measured by checking:
	- development of wireframes
	- performance of UI tests

	Quantification:
	-  -->

<!-- 9. Compatibility See [NFR 3](./Software_Requirements_Specification.md#non-functional-requirements)

	The compatibility of the system is very important so that future integration with HR systems can take place. Using microservices enables the system to be integrated easily due to the separation of concerns.<br>
	Quantification:
	- Deployed on a single server using docker
	- Compatible on screen resolutions from 1280px to 1920px+ -->

## Technology Requirements

### React + Tailwind CSS
Making use of react and tailwind CSS with proper UI design from our frontend developers we can comply with the WCAG 2.1 AA accessibility.

### NestJS
Using NestJS we can build a proper api-gateway, and microservices which will be able to scale well and perform well, thus meeting the requirements for flexibility and performance.

### PostgreSQL
Using PostegreSQL helps keep data persistent for our services and also performs well satisfying our performance requirements.

### Jest, Vitest and Supertest
Using these testing packages we can build tests to ensure our system is functionally suitable.

### Socket.IO, RabbitMQ
These technologies help drive the event driven aspect of our system maintaining live updates for the frontend as well as allowing background processing to take place between requests.

### Caddy
Caddy helps reverse proxy requests coming to our server to the correct endpoints (frontend website or addin and backend api-gateway). Caddy can also be used as a load balancer.

### Docker
Docker containerizes the system in separate containers making our system portable and compatible.

## API Service Contracts

## Deployment

### Deployment Requirements
[View the Live System](https://capstone-five-guys.dns.net.za/)

Currently we have a local development environment that we run on our local computers for testing the integrated system. Then we deploy the system automatically to docker hub and we use watchtower to pull new images into our staging development environment.

In the future we will add a production environment on the server where the most stable versions will be deployed and accessible to everyone. Currently the staging development environment is accessible to all but it will be restricted in the future.

Containerization: All services are containerized and are able to run in a docker environment. This allows the local integration testing and production environments to be reproducible through the containers.

Environment variables are used on the server to set up our current staging development environment, and GitHub secrets are used to deploy our containers to docker hub.

Roll-back strategy: To deploy to production we plan to use rolling deployment to deploy the microservice containers using image tag pinning. If a microservice goes down the system as a whole is still up and we can easily roll back the microservice to an earlier tagged version.<br>
For the api-gateway we plan to use a blue-green deployment strategy to switch the api-gateway to the next version through routing to the blue/green container and if the version fails one can switch back to the the other version.


### Deployment Diagram
!['Deployment Diagram'](<../images/Deployment Diagram.png>)

### CI/CD Pipeline
#### Backend workflow
```mermaid
flowchart TD
    A([On push: main, dev, Backend / pull: main, dev]) --> B(Job: Install dependencies)
    B -->C{Successfull Install?}
	C --> |Yes| K[(Cache node_modules)]
	K --> |use artifacts| D
    C -->|Yes| D[For each backend Service:]
    C -->|No| E([Report failure])
    D --> F(Job: build)
    D --> G(Job: lint)
    D --> H(Job: test)
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
    F --> I{Success?}
    G --> I
    H --> I
    I --> |Yes| J([Report Success])
    I --> |No| E
```

#### Frontend workflow
```mermaid
flowchart TD
    A([On push: main, dev, Frontend / pull: main, dev]) --> B(Job: Install dependencies)
    B -->C{Successfull Install?}
    C -->|Yes| D[For each frontend Service:]
	C --> |Yes| K[(Cache node_modules)]
	K --> |use artifacts| D
    C -->|No| E([Report failure])
    D --> F(Job: build)
    D --> G(Job: lint)
    D --> H(Job: test)
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
	D --> F
	D --> G
	D --> H
    F --> I{Success?}
    G --> I
    H --> I
    I --> |Yes| J([Report Success])
    I --> |No| E
```

#### Integration workflow
```mermaid
flowchart TD
    A([On push: main, dev / pull: main, dev]) --> D([For each service])
    D --> F(Job: run integration tests)
	D --> F
	D --> F
	D --> F
	D --> F
	D --> F
	D --> F
	D --> F
	D --> F
    F --> I{Success?}
    I --> |Yes| J([Report Success])
    I --> |No| E
```

#### CI workflow
```mermaid
flowchart TD
    A([On push: main, dev / pull: dev]) --> B[(Workflow: backend CI)]
    A --> C[(Workflow: frontend CI)]
    C --> D
    B --> D{Success}
    D --> |Yes| E[(Workflow: integration)]
    D --> |No| H([Report failure])
    E --> F{Success?}
    F --> |Yes| G([Report Success])
    F --> |No| H
```

#### Deploy workflow
```mermaid
flowchart TD
    A([On workflow_call]) --> B(Job: build-and-push)
    B --> D(step: checkout repo)
    D --> E(step: login to dockerhub)
    E --> F(step: set up docker build)
	F --> G[For each service]
	G --> H(step: build and push docker image)
	G --> H
	G --> H
	G --> H
	G --> H
	G --> H
	G --> H
	G --> H
	G --> H
    H --> I{Success}
	I --> |Yes| J([Report Success])
	I --> |No| K([Report failure])
```

#### CI/CD workflow
```mermaid
flowchart TD
    A([On pull: main]) --> B[(Workflow: backend CI)]
    A --> C[(Workflow: frontend CI)]
    C --> D
    B --> D{Success}
    D --> |Yes| E[(Workflow: integration)]
    D --> |No| H([Report failure])
    E --> F{Success}
    F --> |Yes| G[(Workflow: deploy)]
	G --> I{Success}
	I --> |Yes| J([Report success])
	I --> |No| H
    F --> |No| H
```
