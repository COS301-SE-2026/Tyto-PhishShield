view the [use cases](./Software_Requirements_Specification.md) in the SRS document.
# Table of contents
- [UC-01](#uc-01-report-a-suspicious-email) Report a suspicious email
- [UC-02](#uc-02-experience-a-teachable-moment) Experience a teachable moment
- [UC-03](#uc-03-view-the-live-leaderboard) View live leaderboard
- [UC-04](#uc-04-users-can-register-accounts) Register account
- [UC-05](#uc-05-users-can-be-authenticated-by-the-system) Authentication
- [UC-06](#uc-06-admin-can-control-and-schedule-campaigns) Control and schedule campaigns
- [UC-07](#uc-07-view-organizational-metrics) View organizational metrics
- [UC-08](#uc-08-configure-campaign-difficulty) Configure campaign difficulty
- [UC-09](#uc-09-manage-user-roles) Manage user roles
- [UC-10](#uc-10-system-can-send-a-scheduled-simulated-phishing-campaign-email) Send scheduled emails
- [UC-11](#uc-11--view-personal-dashboard) View personal dashboard
- [UC-12](#uc-12-scrub-sensitive-data-before-external-api-calls) Scrub sensitive data
- [UC-13](#uc-13-user-receives-xp-update-after-an-action) Recieve XP
- [UC-14](#uc-14-create-and-import-accounts) Create and import accounts
- [UC-15](#uc-15-create-educational-material) Create educational material
- [UC-16](#uc-16-manage-user-states) Manage user states
<br>
<br>
# UC-01: Report a suspicious email
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for reporting an email:
- **Auth Token**: Is the user logged in with a valid session?
- **Item Type**: Is the user selecting an actual email (Valid), or something else like a calendar invite (Invalid)?
- **Report Service**: Is the report service in the backend reachable?
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario              | Auth Token | Item Type | Report Service | Expected Result                                   |
| ------------ | --------------------- | ---------- | --------- | -------------- | ------------------------------------------------- |
| **TC1**      | Successful Report     | V          | V         | V              | Capture headers, display success toast <300ms.    |
| **TC2**      | Unauthenticated User  | I          | NA        | NA             | Display Auth error / redirect to login.           |
| **TC3**      | Invalid Item Selected | V          | I         | NA             | Display error msg: "Only emails can be reported.” |
| **TC4**      | System Unavailable    | V          | V         | I              | Display error msg: "Network timeout."             |
| **TC5**      | User Quits/Cancels    | V          | V         | NA             | Action aborted, back to inbox view.               |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario              | Auth Token                      | Item Type                   | Report Service | Expected Result                                   |
| ------------ | --------------------- | ------------------------------- | --------------------------- | -------------- | ------------------------------------------------- |
| **TC1**      | Successful Report     | `eyJhbGciOiJIUz...` (Valid JWT) | Standard Outlook `MailItem` | V              | Capture headers, display success toast <300ms.    |
| **TC2**      | Unauthenticated User  | Expired JWT                     | NA                          | NA             | Display Auth error / redirect to login.           |
| **TC3**      | Invalid Item Selected | `eyJhbGciOiJIUz...` (Valid JWT) | Outlook `AppointmentItem`   | NA             | Display error msg: "Only emails can be reported.” |
| **TC4**      | System Unavailable    | `eyJhbGciOiJIUz...` (Valid JWT) | Standard Outlook `MailItem` | I              | Display error msg: "Network timeout."             |
| **TC5**      | User Quits/Cancels    | `eyJhbGciOiJIUz...` (Valid JWT) | Standard Outlook `MailItem` | NA             | Action aborted, back to inbox view.               |
# UC-02: Experience a teachable moment
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for Experiencing a teachable moment:
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
# UC-03: View the live leaderboard
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for viewing the live leaderboard:
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |

# UC-04: Users can register accounts
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for user registration:
- **Registration Data**: Is the entered information valid?
- **Password Strength**: Does the password meet security requirements?
- **Accounts Service Status**: Is the accounts service available?
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario                     | Registration Data | Password Strength | Accounts Service Status | Expected Result                            |
| ------------ | ---------------------------- | ----------------- | ----------------- | ----------------------- | ------------------------------------------ |
| **TC1**      | Successful Registration      | V                 | V                 | V                       | User account created successfully.         |
| **TC2**      | Invalid Registration Data    | I                 | NA                | NA                      | Display validation errors for form fields. |
| **TC3**      | Weak Password                | V                 | I                 | NA                      | Display password policy error message.     |
| **TC4**      | Database Failure             | V                 | V                 | I                       | Display error: "Unable to create account." |
| **TC5**      | Duplicate Email Registration | I                 | V                 | V                       | Display error: "Email already registered." |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario                     | Registration Data                     | Password Strength | Accounts Service Status | Expected Result                            |
| ------------ | ---------------------------- | ------------------------------------- | ----------------- | ----------------------- | ------------------------------------------ |
| **TC1**      | Successful Registration      | Name=John Doe, Email=john@example.com | Str0ngP@ss123!    | V                       | User account created successfully.         |
| **TC2**      | Invalid Registration Data    | Missing email field                   | NA                | NA                      | Display validation errors for form fields. |
| **TC3**      | Weak Password                | Valid registration form               | password123       | NA                      | Display password policy error message.     |
| **TC4**      | Database Failure             | Valid registration form               | Str0ngP@ss123!    | I                       | Display error: "Unable to create account." |
| **TC5**      | Duplicate Email Registration | Existing email=john@example.com       | Str0ngP@ss123!    | V                       | Display error: "Email already registered." |
# UC-05: Users can be authenticated by the system
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for authentication:
- **User Credentials**: Are the login credentials valid?
- **Account Status**: Is the account activated?
- **Authentication Service**: Is the authentication backend available?
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario                       | User Credentials | Account Status | Authentication Service | Expected Result                                      |
| ------------ | ------------------------------ | ---------------- | -------------- | ---------------------- | ---------------------------------------------------- |
| **TC1**      | Successful Login               | V                | V              | V                      | User logged in and redirected to dashboard.          |
| **TC2**      | Invalid Credentials            | I                | NA             | NA                     | Display error: "Invalid username or password."       |
| **TC3**      | Account status not active      | V                | I              | I                      | Display error: "Authentication service unavailable." |
| **TC4**      | Authentication Service Offline | V                | V              | I                      | Display error: "Authentication service unavailable." |
| **TC5**      | User Cancels Login             | V                | NA             | NA                     | Login aborted and user stays on login page.          |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario                       | User Credentials                                | Account Status           | Authentication Service | Expected Result                                      |
| ------------ | ------------------------------ | ----------------------------------------------- | ------------------------ | ---------------------- | ---------------------------------------------------- |
| **TC1**      | Successful Login               | Email=john@example.com, Password=Str0ngP@ss123! | `Active`                 | V                      | User logged in and redirected to dashboard.          |
| **TC2**      | Invalid Credentials            | Email=john@example.com, Password=WrongPass      | NA                       | NA                     | Display error: "Invalid username or password."       |
| **TC3**      | Account status not active      | Email=john@example.com, Password=Str0ngP@ss123! | `Suspended` / `Inactive` | I                      | Display error: "Authentication service unavailable." |
| **TC4**      | Authentication Service Offline | Email=john@example.com, Password=Str0ngP@ss123! | `Active`                 | I                      | Display error: "Authentication service unavailable." |
| **TC5**      | User Cancels Login             | Email=john@example.com, Password=Str0ngP@ss123! | NA                       | NA                     | Login aborted and user stays on login page.          |
# UC-06: Admin can control and schedule campaigns
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for configuring phishing campaigns:
- **Admin Auth**: Is the admin logged in with valid privileges?
- **Campaign Parameters**: Are the campaign settings valid (target group, schedule, difficulty)?
- **Scheduler Service**: Is the scheduling backend available?
V = Valid, I = Invalid, NA = Not Applicable

|Test Case ID|Scenario|Admin Auth|Campaign Parameters|Scheduler Service|Expected Result|
|---|---|---|---|---|---|
|**TC1**|Successful Campaign Scheduling|V|V|V|Campaign saved and scheduled successfully.|
|**TC2**|Unauthorized User Access|I|NA|NA|Access denied / redirect to login page.|
|**TC3**|Invalid Campaign Parameters|V|I|NA|Display validation errors for invalid fields.|
|**TC4**|Scheduler Service Offline|V|V|I|Display error: "Unable to schedule campaign."|
|**TC5**|Admin Cancels Configuration|V|V|NA|Campaign creation aborted without saving.|

## 2. Identifying Test Data Values (The Concrete Data Matrix)

|Test Case ID|Scenario|Admin Auth|Campaign Parameters|Scheduler Service|Expected Result|
|---|---|---|---|---|---|
|**TC1**|Successful Campaign Scheduling|Valid Admin JWT|Target=Finance Dept, Difficulty=Medium, Schedule=2026-05-20 09:00|V|Campaign saved and scheduled successfully.|
|**TC2**|Unauthorized User Access|Expired JWT|NA|NA|Access denied / redirect to login page.|
|**TC3**|Invalid Campaign Parameters|Valid Admin JWT|Empty target group, invalid past date|NA|Display validation errors for invalid fields.|
|**TC4**|Scheduler Service Offline|Valid Admin JWT|Valid campaign configuration|I|Display error: "Unable to schedule campaign."|
|**TC5**|Admin Cancels Configuration|Valid Admin JWT|Valid campaign configuration|NA|Campaign creation aborted without saving.|
# UC-07: View organizational metrics
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for viewing organizational metrics:
- Account Role
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
# UC-08: Configure campaign difficulty
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for configuring campaign difficulty:
- Account Role
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
# UC-09: Manage user roles
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for managing user roles:
- Account Role
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |

# UC-10: System can send a scheduled simulated phishing campaign email
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for sending scheduled phishing emails:
- **Campaign Schedule**: Is the campaign scheduled correctly?
- **Target User List**: Are valid recipients available?
- **Mail Service Status**: Is the email delivery service operational?
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario                  | Campaign Schedule | Target User List | Mail Service Status | Expected Result                                                    |
| ------------ | ------------------------- | ----------------- | ---------------- | ------------------- | ------------------------------------------------------------------ |
| **TC1**      | Successful Email Delivery | V                 | V                | V                   | Simulated phishing emails sent successfully.                       |
| **TC2**      | Invalid Schedule          | I                 | NA               | NA                  | Campaign execution blocked with scheduling error.                  |
| **TC3**      | Empty Target Group        | V                 | I                | NA                  | Display error: "No recipients found."                              |
| **TC4**      | Mail Service Failure      | V                 | V                | I                   | Email delivery fails and system logs error.                        |
| **TC5**      | Partial Delivery Failure  | V                 | V                | I                   | Failed recipients logged while successful emails continue sending. |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario                  | Campaign Schedule       | Target User List                           | Mail Service Status | Expected Result                                            |
| ------------ | ------------------------- | ----------------------- | ------------------------------------------ | ------------------- | ---------------------------------------------------------- |
| **TC1**      | Successful Email Delivery | 2026-05-20 09:00        | `[john@example.com, sam@example.com, ...]` | V                   | Simulated phishing emails sent successfully.               |
| **TC2**      | Invalid Schedule          | Null schedule timestamp | NA                                         | NA                  | Campaign execution blocked with scheduling error.          |
| **TC3**      | Empty Target Group        | Valid scheduled time    | Empty user group                           | NA                  | Display error: "No recipients found."                      |
| **TC4**      | Mail Service Failure      | Valid scheduled time    | `[john@example.com, sam@example.com, ...]` | I                   | Email delivery fails and system logs error.                |
| **TC5**      | Partial Delivery Failure  | Valid scheduled time    | `[john, sa m@, ...]`                       | I                   | Failed recipients logged while valid users receive emails. |
# UC-11:  View personal dashboard
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for viewing personal dashboard:
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
# UC-12: Scrub sensitive data before external API calls
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for scrubbing sensitive data:
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario |     |     |     | Expected Result |
| ------------ | -------- | --- | --- | --- | --------------- |
| **TC1**      |          |     |     |     |                 |
| **TC2**      |          |     |     |     |                 |
| **TC3**      |          |     |     |     |                 |
| **TC4**      |          |     |     |     |                 |
| **TC5**      |          |     |     |     |                 |

# UC-13: User receives XP update after an action
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for updating user XP:
- **User Auth**: Is the user authenticated?
- **User Action**: Is the triggering action valid?
- **XP Service Status**: Is the XP calculation/update service available?
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario                | User Auth | User Action | XP Service Status | Expected Result                             |
| ------------ | ----------------------- | --------- | ----------- | ----------------- | ------------------------------------------- |
| **TC1**      | XP Updated Successfully | V         | V           | V                 | User XP updated and reflected on dashboard. |
| **TC2**      | Unauthenticated User    | I         | NA          | NA                | XP update rejected due to invalid session.  |
| **TC3**      | Invalid User Action     | V         | I           | NA                | No XP changes applied.                      |
| **TC4**      | XP Service Failure      | V         | V           | I                 | Display error and log failed XP update.     |
| **TC5**      | Duplicate XP Trigger    | V         | I           | V                 | XP update prevented to avoid duplication.   |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

|Test Case ID|Scenario|User Auth|User Action|XP Service Status|Expected Result|
|---|---|---|---|---|---|
|**TC1**|XP Updated Successfully|Valid User JWT|Report phishing email|V|User gains +50 XP and dashboard refreshes.|
|**TC2**|Unauthenticated User|Expired JWT|Report phishing email|NA|XP update rejected due to invalid session.|
|**TC3**|Invalid User Action|Valid User JWT|Unsupported action type|NA|No XP changes applied.|
|**TC4**|XP Service Failure|Valid User JWT|Clicked phishing simulation link|I|Display error and log failed XP update.|
|**TC5**|Duplicate XP Trigger|Valid User JWT|Same phishing report submitted twice|V|XP update prevented to avoid duplication.|
# UC-14: Create and import accounts
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for creating and importing accounts:
- Account Role
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
# UC-15: Create educational material
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for imports for creating educational material:
- Account Role
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
# UC-16: Manage user states
## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)
Inputs for managing user states:
- Account Role
- 
V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role |     |     | Expected Result |
| ------------ | -------- | ------------ | --- | --- | --------------- |
| **TC1**      |          |              |     |     |                 |
| **TC2**      |          |              |     |     |                 |
| **TC3**      |          |              |     |     |                 |
| **TC4**      |          |              |     |     |                 |
| **TC5**      |          |              |     |     |                 |
