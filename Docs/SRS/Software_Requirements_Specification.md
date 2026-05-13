# Tyto-PhishShield <br>
> FiveGuys Capstone project

The Team:

| Name      | Surname | Student Number |
| --------- | ------- | -------------- |
| Josua     | Louw    | u24569772      |
| Darius    | Erasmus | u24586189      |
| Frikkie   | Malan   | u14439141      |
| Nico      | Theron  | u23565722      |
| Heindrich | Jansen  | u24711358      |
# Table of Contents
 - [Overview](#overview)
 - [Functional Requirements](#functional-requirements)
 - [Optional Functional Requirements](#optional-functional-requirements-including-wow-factors)
 - [Non-Functional Requirements](#non-functional-requirements)
 - [Use Cases + User Stories](#use-cases---user-stories)
 - [Use Case Diagrams](#use-case-diagrams)
 - [Requirements Use Case Traceability Matrix](#requirements-use-case-traceability-matrix)
 - [Domain Model](#domain-model)
 - [Architecture Diagram](#architecture-diagram)

## Overview
This document contains a list of all the functional and non-functional requirements that needs to be met for the project to be considered as complete. It also contains all the use cases and user stories derived from the functional requirements as well as the test cases to consider for each user story.

## Functional Requirements
**FR 1**: Outlook Add-in & Reporting Component
	**FR 1.1**: The system shall expose a “Report Phish” button in the Outlook ribbon across Desktop, Web and Mobile via the native Office JS API.
	**FR 1.2**: The system shall capture the email headers and body upon the user clicking the “Report Phish” button.
	**FR 1.3**: The system shall display a confirmation toast notification to the user upon a successful report submission.

**FR 2**: AI phishing simulation
	**FR 2.1**: The system shall use an LLM powered phishing content generator.
	    **FR 2.1.1**: The phishing content generator must have configurable difficulty.
    **FR 2.2**: The system must support email campaign types.
    **FR 2.3**: The system shall scrub sensitive information using a local LLM before transmitting data to external APIs.

**FR 3**: Gamification engine
	**FR 3.1**: The system shall update user XP according to the user’s actions.
	    **FR 3.1.1**: The system shall reward XP for correctly reporting a phishing email.
	    **FR 3.1.2**: The system shall deduct XP for interacting with a simulated phishing attack.
	    **FR 3.1.3**: The system shall deduct XP when a user incorrectly reports a legitimate email as phishing.
	    **FR 3.1.4**: The system will update XP immediately after the action is processed.
    **FR 3.2**: The system shall provide a learning experience to educate the user.
	    **FR 3.2.1**: The learning experience shall point out specific phishing indicators.
	    **FR 3.2.2**: The learning experience shall provide a short explanation of why the content is malicious.
	    **FR 3.2.3**: The learning experience shall display corrective guidance on how to identify similar threats in the future and how the user should handle it.
    **FR 3.3**: The system shall provide a leader board with department and team rankings.
	    **FR 3.3.1**: The leaderboard will be updated live.

**FR 4**: Authentication and Authorization 
	**FR 4.1**: The system shall allow user registration and login.
    **FR 4.2**: The system shall use Auth0/Firebase Authentication for user functionalities such as user login and registration, session management (JWT/token handling) and password reset.
    **FR 4.3**: The system shall enforce Role-Based Access Control (RBAC) supporting three distinct roles: Admin, Analyst and User.
    **FR 4.4**: The system shall evaluate RBAC server-side on every protected backend endpoint (API Gateway layer).

**FR 5**: Admin campaign portal
	**FR 5.1**: The system shall allow administrators to configure the difficulty level and context of generated phishing campaigns.
    **FR 5.2**: The system shall support the scheduling and execution of targeted email  campaigns to specific user groups.
    **FR 5.3**: The system shall allow real-time statistics for a campaign.
    **FR 5.4**: The system shall allow Admin and Analyst roles to view aggregated organizational metrics.
	    **FR 5.4.1**: The metrics shall include user reporting behavior and common failure points.

## Optional Functional Requirements Including WOW Factors
**OFR1**: SMS Smishing Module (Not sure if it will be implemented with SMS or WhatsApp)
	**OFR 1.1**: The user can validate suspected smishing by reporting a screenshot of the message.

**OFR2**: Departmental Risk Heatmap
	**OFR 2.1**: The admin can view a generated visual departmental heatmap.
		**OFR 2.1.1**: The heatmap can show each department's risk and vulnerability over time.
	    **OFR 2.1.2**: The heatmap can be used to drill down into individual user metrics.

**OFR3**: Real threat detection mode
	**OFR 3.1**: Users can report real suspected phishing emails, that were not sent by our system, for analyst review.
    **OFR 3.2**: Users can receive XP for identifying a real phishing email that contributes to the leaderboard.

**OFR4**: Manager Summary reports
	**OFR 4.1**: Automated summary reports can be scheduled and sent to managers to inform them of their team’s individual scores and improvement trends.

**OFR5**: Open Webhook API
	**OFR 5.1**: Expose a documented REST API so Tyto clients can integrate PhishShield data into their existing SIEM or HR platforms. 

**OFR6**: Live AI red team mode **(Wow Factor 1)**
	**OFR 6.1**: The system autonomously gathers publicly available user or company data (e.g. LinkedIn profiles or company websites) for phishing simulation generation. 
    **OFR 6.2**: The system will generate personalised phishing attacks using AI without requiring manual admin input. 
    **OFR 6.3**: The system shall allow admins to enable or disable autonomous red team mode for campaigns.

**OFR7**: Battle Royale **(Wow Factor 2)**
	**OFR 7.1**: The system shall support organization-wide time-limited phishing simulation events. 
    **OFR 7.2**: The system shall group users into teams or departments for competitive participation. 
    **OFR 7.3**: The system shall maintain a live tournament leaderboard during events and shall track and rank team performance based on phishing detection accuracy.

**OFR8**: Predictive Vulnerability Score **(Wow Factor 3)**
	**OFR 8.1**: The system shall analyze historical data and generate a predictive risk score for each user.
    **OFR 8.2**: The system will identify users that are likely to fall for phishing attacks within a defined upcoming period.
    **OFR 8.3**: The system shall provide an actionable intervention list for admins and managers. 
    **OFR 8.4**: The system will update predictive scores dynamically according to user data collected during the previous time period.

**OFR9**: Educational testing environment
	**OFR 9.1**: The system will allow users who failed to detect phishing content to go through educational material.
    **OFR 9.2**: The system will let the user take a test to learn how to detect phishing content.
    **OFR 9.3**: The system will allow the user to earn XP points based on how well the user did in the test.
## Non-Functional Requirements
**NFR 1**: Security
	**NFR 1.1**: The system shall authenticate user roles at the API gateway layer.
	**NFR 1.2**: The system’s data at rest and in transit must be encrypted.

**NFR 2**: Performance
	**NFR 2.1**: The system shall handle XP transactions and leader board updates within 500ms of user action.
	**NFR 2.2**: The system shall load “Teachable moment” screens within 1s of clicking a link on a phishing email.
	**NFR 2.3**: The system shall display confirmation toasts in the Outlook Add-in feature within 300ms.

**NFR 3**: Portability and Compatibility
	**NFR 3.1**: The system’s admin dashboard shall support standard desktop resolutions and maintain usability across commonly used screen sizes including resolutions from 1280px to 1920px+ . 
	**NFR 3.2**: The system’s “report phish” button must appear on the Outlook ribbon on Desktop, Web, and Mobile.

**NFR 4**: Usability
	**NFR 4.1**: The system’s “report phish” button must follow the Microsoft Fluent UI design system.

**NFR 5**: Reliability and Availability
	**NFR 5.1**: The system must have 99.9% uptime.

**NFR 6**: Scalability:
	**NFR 6.1**: The system must be able to scale to handle 500 concurrent users.

**NFR 7**: Maintainability
	**NFR 7.1**: The system shall make use of the microservices architecture to increase the maintainability of each subsystem.
	**NFR 7.2**: The system stack must be fully dockerized for handoff.
## Use Cases + User Stories

| Use Case ID | Use Case Description                                           | Agile User Story                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UC-01**   | Users can report a suspicious email.                           | As an employee, I want to report a suspicious email with a single click in the Outlook ribbon, so that I can earn XP on a correct report.                                                    |
| **UC-02**   | Users can experience a teachable moment upon making a mistake. | As an employee I want to receive immediate, specific feedback when I fail to identify a phishing email or message so that I can be educated appropriately and my XP is adjusted accordingly. |
| **UC-03**   | Users can view the live leaderboard.                           | As a user, I want to view a real-time leaderboard showing my XP and team rankings, so that I stay motivated to accurately identify phishing emails.                                          |
| **UC-04**   | Users can register accounts.                                   | As a new user, I want to register for an account securely, so that I can be part of the phishing platform and start tracking my progress.                                                    |
| **UC-05**   | Users can be authenticated by the system.                      | As a registered user, I want to log in securely, so that I can access my dashboard and role-specific features.                                                                               |
| **UC-06**   | Admin can control and schedule campaigns.                      | As an Admin, I want to configure campaign parameters such as target group and schedule, so that the AI-generated phishing campaigns are tailored and executed at the scheduled times.        |
| **UC-07**   | Admin and Analyst can view organizational metrics.             | As an Admin or Analyst, I want to view aggregated organizational metrics, so that I can identify common failure points and track the company's overall security posture.                     |
| **UC-08**   | Admin can configure campaign difficulty.                       | As an Admin, I want to configure the difficulty level and context of AI-generated campaigns, so that the simulations match the evolving skill levels of our employees.                       |
| **UC-09**   | Admin can manage users and roles .                             | As an Admin, I want to assign roles (Admin, Analyst, User) for registered accounts, so that I can control what each person can access within the platform.                                   |
| **UC-10**   | System can send a scheduled simulated phishing campaign email. | As the system, I want to automatically deliver AI-generated phishing emails to targeted user groups at the scheduled times, so that employees are tested without manual intervention.        |
| **UC-11**   | User can view their personal dashboard                         | As a user, I want to view my personal XP, progress history, and past campaign results, so that I can track my own improvement over time.                                                     |
| **UC-12**   | System scrubs sensitive data before external API calls         | As the system, I want to automatically redact sensitive information from email content before sending it to external LLM APIs, so that POPIA/GDPR compliance is maintained.                  |
| **UC-13**   | User receives XP update after an action                        | As a user, I want my XP to be automatically updated after I report a phishing email or fall for a simulation, so that my score accurately reflects my performance.                           |
| UC-14       | Admin can create and import accounts.                          | As an admin, I want to be able to add the users in my company to the system, so that they can easily access the system under my company.                                                     |
## Use Case Diagrams

![Register and Login Use Cases](<../images/Register and Login Use Cases.jpg>)

![General Interaction Use Cases](<../images/General Interaction Use Cases.jpg>)

![Campaign Use Cases](<../images/Campaign Use Cases.jpg>)

![Analystic Use Cases](<../images/Analystic Use Cases.jpg>)

## Requirements Use Case Traceability Matrix

|              | Priority Weight | UC-01  | UC-02  | UC-03 | UC-04 | UC-05 | UC-06  | UC-07 | UC-08 | UC-09 | UC-10 | UC-11 | UC-12 | UC-13 | UC-14 |
| ------------ | --------------- | ------ | ------ | ----- | ----- | ----- | ------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **FR 1.1**   | 2               | X      |        |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 1.2**   | 1               | X      |        |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 1.3**   | 2               | X      |        |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 2.1**   | 3               |        |        |       |       |       | X      |       | X     |       | X     |       |       |       |       |
| **FR 2.1.1** | 1               |        |        |       |       |       | X      |       | X     |       |       |       |       |       |       |
| **FR 2.2**   | 3               |        |        |       |       |       | X      |       |       |       | X     |       |       |       |       |
| **FR 2.3**   | 2               |        |        |       |       |       |        |       |       |       |       |       | X     |       |       |
| **FR 3.1**   | 2               | X      | X      |       |       |       |        |       |       |       |       |       |       | X     |       |
| **FR 3.1.1** | 2               | X      |        |       |       |       |        |       |       |       |       |       |       | X     |       |
| **FR 3.1.2** | 2               |        | X      |       |       |       |        |       |       |       |       |       |       | X     |       |
| **FR 3.1.3** | 1               | X      |        |       |       |       |        |       |       |       |       |       |       | X     |       |
| **FR 3.1.4** | 2               | X      | X      |       |       |       |        |       |       |       |       |       |       | X     |       |
| **FR 3.2**   | 1               |        | X      |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 3.2.1** | 1               |        | X      |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 3.2.2** | 1               |        | X      |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 3.2.3** | 1               |        | X      |       |       |       |        |       |       |       |       |       |       |       |       |
| **FR 3.3**   | 2               |        |        | X     |       |       |        |       |       |       |       | X     |       |       |       |
| **FR 3.3.1** | 2               |        |        | X     |       |       |        |       |       |       |       | X     |       |       |       |
| **FR 4.1**   | 3               |        |        |       | X     | X     |        |       |       |       |       |       |       |       | X     |
| **FR 4.2**   | 2               |        |        |       | X     | X     |        |       |       |       |       |       |       |       |       |
| **FR 4.3**   | 2               |        |        |       |       | X     |        |       |       | X     |       |       |       |       | X     |
| **FR 4.4**   | 2               |        |        |       |       | X     |        |       |       |       |       |       |       |       |       |
| **FR 5.1**   | 1               |        |        |       |       |       | X      |       | X     |       |       |       |       |       |       |
| **FR 5.2**   | 2               |        |        |       |       |       | X      |       |       |       | X     |       |       |       |       |
| **FR 5.3**   | 2               |        |        | X     |       |       |        | X     |       |       |       |       |       |       |       |
| **FR 5.4**   | 1               |        |        | X     |       |       |        | X     |       |       |       |       |       |       |       |
| **FR 5.4.1** | 1               |        |        |       |       |       |        | X     |       |       |       |       |       |       |       |
| **Score**    |                 | **12** | **10** | **7** | **5** | **9** | **10** | **4** | **5** | **2** | **8** | **4** | **2** | **9** | 5     |
## Domain Model
## Architecture Diagram

---
For more details on user stories see: [User Stories](./User_Stories)

For test cases of each user story see: [Test Cases](./Test_Cases)
