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

Inputs for experience a teachable moment:

- **Simulation Link**: Is simulation link valid or available as required?
- **Tracking Reference**: Is tracking reference valid or available as required?
- **Education Page**: Is education page valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Simulation Link | Tracking Reference | Education Page | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Teachable Moment | V | V | V | Display phishing explanation and educational guidance. |
| **TC2** | Invalid Tracking Link | V | I | NA | Reject invalid tracking reference without exposing user data. |
| **TC3** | Missing Simulation Context | I | NA | NA | Show safe fallback or unavailable-message; do not associate another user. |
| **TC4** | Education Page Unavailable | V | V | I | Show an error or safe fallback page. |
| **TC5** | Repeated Link Visit | V | V | V | Display guidance without recording a duplicate event. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Simulation Link | Tracking Reference | Education Page | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Teachable Moment | Simulated link from delivered email | Valid tracking token | Education page available | Display phishing explanation and educational guidance. |
| **TC2** | Invalid Tracking Link | Simulated link | Unknown tracking token | NA | Reject invalid tracking reference without exposing user data. |
| **TC3** | Missing Simulation Context | Unrecognized URL | NA | NA | Show safe fallback or unavailable-message; do not associate another user. |
| **TC4** | Education Page Unavailable | Valid simulation URL | Valid tracking token | Education service offline | Show an error or safe fallback page. |
| **TC5** | Repeated Link Visit | Previously visited simulation URL | Previously used tracking token | Education page available | Display guidance without recording a duplicate event. |

# UC-03: View the live leaderboard

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for view the live leaderboard:

- **User Session**: Is the user authenticated?
- **Leaderboard Data**: Is leaderboard data valid or available as required?
- **XP Service**: Is xp service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | User Session | Leaderboard Data | XP Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Leaderboard View | V | V | V | Display ranked users and XP totals. |
| **TC2** | Unauthenticated Access | I | NA | NA | Deny access or redirect to login. |
| **TC3** | No Leaderboard Entries | V | I | V | Display an empty-state message. |
| **TC4** | XP Service Unavailable | V | V | I | Display a loading failure or service error. |
| **TC5** | Leaderboard Data Refresh | V | V | V | Refresh displayed rankings after an XP update. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | User Session | Leaderboard Data | XP Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Leaderboard View | Valid user JWT | Three users with XP totals | XP service online | Display ranked users and XP totals. |
| **TC2** | Unauthenticated Access | Expired JWT | NA | NA | Deny access or redirect to login. |
| **TC3** | No Leaderboard Entries | Valid user JWT | Empty leaderboard dataset | XP service online | Display an empty-state message. |
| **TC4** | XP Service Unavailable | Valid user JWT | Existing leaderboard entries | XP service offline | Display a loading failure or service error. |
| **TC5** | Leaderboard Data Refresh | Valid user JWT | User XP changes from 100 to 150 | XP service online | Refresh displayed rankings after an XP update. |

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

Inputs for view organizational metrics:

- **Account Role**: Does the user have the required permissions?
- **Analytics Data**: Is analytics data valid or available as required?
- **Analytics Service**: Is analytics service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Analytics Data | Analytics Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Metrics View | V | V | V | Display organizational analytics for authorized user. |
| **TC2** | Unauthorized Access | I | NA | NA | Deny access to organizational metrics. |
| **TC3** | No Metrics Available | V | I | V | Display an empty state without fabricated statistics. |
| **TC4** | Analytics Service Offline | V | V | I | Display a service error without misleading values. |
| **TC5** | Updated Metrics | V | V | V | Display updated metrics after refresh. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Analytics Data | Analytics Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Metrics View | Valid admin JWT | Campaign reports with tracked events | Analytics service online | Display organizational analytics for authorized user. |
| **TC2** | Unauthorized Access | Valid standard-user JWT | NA | NA | Deny access to organizational metrics. |
| **TC3** | No Metrics Available | Valid analyst JWT | No campaign data | Analytics service online | Display an empty state without fabricated statistics. |
| **TC4** | Analytics Service Offline | Valid admin JWT | Existing campaign data | Analytics service offline | Display a service error without misleading values. |
| **TC5** | Updated Metrics | Valid analyst JWT | New campaign event added | Analytics service online | Display updated metrics after refresh. |

# UC-08: Configure campaign difficulty

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for configure campaign difficulty:

- **Account Role**: Does the user have the required permissions?
- **Difficulty Selection**: Is difficulty selection valid or available as required?
- **Campaign Service**: Is campaign service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Difficulty Selection | Campaign Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Valid Difficulty Selection | V | V | V | Save the selected campaign difficulty. |
| **TC2** | Unauthorized User | I | NA | NA | Deny difficulty configuration. |
| **TC3** | Invalid Difficulty | V | I | NA | Reject unsupported difficulty value. |
| **TC4** | Campaign Service Offline | V | V | I | Show an error; do not claim the setting was saved. |
| **TC5** | Cancel Difficulty Change | V | V | NA | Discard changes and retain previous difficulty. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Difficulty Selection | Campaign Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Valid Difficulty Selection | Valid admin JWT | medium | Campaign service online | Save the selected campaign difficulty. |
| **TC2** | Unauthorized User | Valid standard-user JWT | NA | NA | Deny difficulty configuration. |
| **TC3** | Invalid Difficulty | Valid admin JWT | expert | NA | Reject unsupported difficulty value. |
| **TC4** | Campaign Service Offline | Valid admin JWT | hard | Campaign service offline | Show an error; do not claim the setting was saved. |
| **TC5** | Cancel Difficulty Change | Valid admin JWT | Change easy to hard, then cancel | NA | Discard changes and retain previous difficulty. |

# UC-09: Manage user roles

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for manage user roles:

- **Account Role**: Does the user have the required permissions?
- **Target User and Role**: Is target user and role valid or available as required?
- **Accounts Service**: Is accounts service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Target User and Role | Accounts Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Role Change | V | V | V | Update the target user role. |
| **TC2** | Unauthorized Role Change | I | NA | NA | Reject the role-change request. |
| **TC3** | Invalid Target User | V | I | V | Display user-not-found or validation error. |
| **TC4** | Accounts Service Offline | V | V | I | Show error and preserve existing role. |
| **TC5** | Cancel Role Change | V | V | NA | Close editor without changing user role. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Target User and Role | Accounts Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Role Change | Valid admin JWT | Existing user: user to analyst | Accounts service online | Update the target user role. |
| **TC2** | Unauthorized Role Change | Valid standard-user JWT | NA | NA | Reject the role-change request. |
| **TC3** | Invalid Target User | Valid admin JWT | Unknown user ID | Accounts service online | Display user-not-found or validation error. |
| **TC4** | Accounts Service Offline | Valid admin JWT | Existing user: analyst to admin | Accounts service offline | Show error and preserve existing role. |
| **TC5** | Cancel Role Change | Valid admin JWT | Existing user: user to admin; cancel | NA | Close editor without changing user role. |

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

# UC-11: View personal dashboard

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for view personal dashboard:

- **User Session**: Is the user authenticated?
- **Personal Data**: Is personal data valid or available as required?
- **Dashboard Services**: Is dashboard services valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | User Session | Personal Data | Dashboard Services | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Dashboard View | V | V | V | Display the signed-in user’s personal statistics. |
| **TC2** | Unauthenticated User | I | NA | NA | Redirect to login or deny access. |
| **TC3** | New User Without Activity | V | I | V | Display valid zero values or empty-state cards. |
| **TC4** | Dashboard Service Failure | V | V | I | Display an error instead of inaccurate statistics. |
| **TC5** | Dashboard Refresh | V | V | V | Display newly recorded personal activity. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | User Session | Personal Data | Dashboard Services | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Dashboard View | Valid user JWT | XP=150; reports=2; completed training=1 | Services online | Display the signed-in user’s personal statistics. |
| **TC2** | Unauthenticated User | Expired JWT | NA | NA | Redirect to login or deny access. |
| **TC3** | New User Without Activity | Valid newly registered user JWT | No reports, XP or training history | Services online | Display valid zero values or empty-state cards. |
| **TC4** | Dashboard Service Failure | Valid user JWT | Existing personal activity | Relevant backend service offline | Display an error instead of inaccurate statistics. |
| **TC5** | Dashboard Refresh | Valid user JWT | XP increases from 100 to 150 | Services online | Display newly recorded personal activity. |

# UC-12: Scrub sensitive data before external API calls

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for scrub sensitive data before external api calls:

- **Input Content**: Is input content valid or available as required?
- **Scrubbing Result**: Is scrubbing result valid or available as required?
- **External API**: Is external api valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Input Content | Scrubbing Result | External API | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Data Scrubbing | V | V | V | Send only sanitized content to the external API. |
| **TC2** | No Sensitive Data | V | V | V | Pass permitted content without unnecessary alteration. |
| **TC3** | Scrubbing Failure | V | I | NA | Block the external request to prevent data leakage. |
| **TC4** | Invalid Input | I | NA | NA | Reject malformed input before external transmission. |
| **TC5** | External API Failure | V | V | I | Handle API failure without exposing unsanitized input. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Input Content | Scrubbing Result | External API | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Data Scrubbing | Email body containing name and email address | Sensitive values replaced with placeholders | Mock external API online | Send only sanitized content to the external API. |
| **TC2** | No Sensitive Data | Generic phishing example with no personal data | Unchanged permitted text | Mock external API online | Pass permitted content without unnecessary alteration. |
| **TC3** | Scrubbing Failure | Email body containing sensitive details | Scrubber throws an error | NA | Block the external request to prevent data leakage. |
| **TC4** | Invalid Input | Null or unsupported payload | NA | NA | Reject malformed input before external transmission. |
| **TC5** | External API Failure | Email body with test@example.com | Email replaced with placeholder | Mock external API returns 503 | Handle API failure without exposing unsanitized input. |

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

Inputs for create and import accounts:

- **Account Role**: Does the user have the required permissions?
- **Import Data**: Is import data valid or available as required?
- **Company Service**: Is company service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Import Data | Company Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful CSV Import | V | V | V | Import valid employee records and show result. |
| **TC2** | Unauthorized Import | I | NA | NA | Deny employee import. |
| **TC3** | Missing Required Mapping | V | I | V | Reject import and report missing required fields. |
| **TC4** | Invalid Employee Row | V | I | V | Report invalid row and import outcome. |
| **TC5** | Company Service Offline | V | V | I | Show import failure; do not claim success. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Import Data | Company Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful CSV Import | Valid admin JWT | CSV with employeeId,email and two valid rows | Company service online | Import valid employee records and show result. |
| **TC2** | Unauthorized Import | Valid standard-user JWT | NA | NA | Deny employee import. |
| **TC3** | Missing Required Mapping | Valid admin JWT | CSV mapping missing email | Company service online | Reject import and report missing required fields. |
| **TC4** | Invalid Employee Row | Valid admin JWT | CSV row with malformed email | Company service online | Report invalid row and import outcome. |
| **TC5** | Company Service Offline | Valid admin JWT | Valid two-row employee CSV | Company service offline | Show import failure; do not claim success. |

# UC-15: Create educational material

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for create educational material:

- **Account Role**: Does the user have the required permissions?
- **Question Data**: Is question data valid or available as required?
- **Education Service**: Is education service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Question Data | Education Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Question Creation | V | V | V | Save the educational question. |
| **TC2** | Unauthorized Creation | I | NA | NA | Deny educational content creation. |
| **TC3** | Missing Question Text | V | I | NA | Display question validation error. |
| **TC4** | Invalid Answer Index | V | I | NA | Reject correct-answer index outside options range. |
| **TC5** | Education Service Offline | V | V | I | Show failure without claiming the question was saved. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Question Data | Education Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful Question Creation | Valid admin JWT | Question with four options and correct index 1 | Education service online | Save the educational question. |
| **TC2** | Unauthorized Creation | Valid standard-user JWT | NA | NA | Deny educational content creation. |
| **TC3** | Missing Question Text | Valid admin JWT | Empty questionText | NA | Display question validation error. |
| **TC4** | Invalid Answer Index | Valid admin JWT | Four options; correctOptionIndex=5 | NA | Reject correct-answer index outside options range. |
| **TC5** | Education Service Offline | Valid admin JWT | Valid question with four options | Education service offline | Show failure without claiming the question was saved. |

# UC-16: Manage user states

## 1. Use Case Based Test Case Generation (The V/I/NA Matrix)

Inputs for manage user states:

- **Account Role**: Does the user have the required permissions?
- **Target User and State**: Is target user and state valid or available as required?
- **Accounts Service**: Is accounts service valid or available as required?

V = Valid, I = Invalid, NA = Not Applicable

| Test Case ID | Scenario | Account Role | Target User and State | Accounts Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful State Change | V | V | V | Update the selected user state. |
| **TC2** | Unauthorized State Change | I | NA | NA | Deny user-state management. |
| **TC3** | Unknown Target User | V | I | V | Show user-not-found error. |
| **TC4** | Invalid State Value | V | I | V | Reject unsupported user-state value. |
| **TC5** | Accounts Service Offline | V | V | I | Show error and retain previous user state. |

## 2. Identifying Test Data Values (The Concrete Data Matrix)

| Test Case ID | Scenario | Account Role | Target User and State | Accounts Service | Expected Result |
|---|---|---|---|---|---|
| **TC1** | Successful State Change | Valid admin JWT | Existing active user to inactive | Accounts service online | Update the selected user state. |
| **TC2** | Unauthorized State Change | Valid standard-user JWT | NA | NA | Deny user-state management. |
| **TC3** | Unknown Target User | Valid admin JWT | Nonexistent user ID | Accounts service online | Show user-not-found error. |
| **TC4** | Invalid State Value | Valid admin JWT | State=archived-unknown | Accounts service online | Reject unsupported user-state value. |
| **TC5** | Accounts Service Offline | Valid admin JWT | Existing inactive user to active | Accounts service offline | Show error and retain previous user state. |
