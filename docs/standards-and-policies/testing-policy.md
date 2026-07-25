<h1>Testing Policy Document</h1>

<h2>Purpose</h2>

This document defines standards and procedures for software testing for the Tyto-PhishShield project. It establishes a consistent approach to
planning, executing, documenting, and reviewing testing activities to ensure software quality,
reliability, and compliance with project requirements.

<h2>Scope</h2>
This document outlines testing objectives, testing types namely: unit, integration and end-to-end tests, as well as tools and environments used for testing and the process of fixing failed tests.

<h2>Testing Objectives</h2>
Verifies that:
- Emails are sent correctly to the correct recipients.
- Reports from the Outlook-addin are received and processed correctly.
- XP is assigned to the user after an email is correctly reported.
- Authentication / authorization flows (register, login, etc.) work correctly and securely.

<h2>Testing Types</h2>
- <b>Unit Testing (Jest):</b> tests individual functions in isolation, with dependencies mocked.
- <b>Integartion Testing (Jest + Supertest):</b> tests how components work together such as an API gateway endpoint calling to a service, or a service correctly altering its database.

<h2>Tools and environments</h2>
- <b>Jest:</b> Unit and integration testing across backend services.
- <b>Supertest:</b> HTTP endpoint testing for integartion testing.
- <b>GitHub Actions:</b> CI pipeline, running unit testing automatically on PRs to dev or main.

<h2>Defective Management Process</h2>
1. <b>Detection:</b> errors / defect are found via failed manual testing or automated testing (CI).
2. <b>Logging:</b> The error / defect is recorded using a logger with a description.
3. <b>Assignment:</b> The error / defect is assigned to whoever owns that part of the codebase.
4. <b>Fix:</b> The error / defect is fixed and the tests are updated accordingly.
5. <b>Verify:</b> The tests are re-run to confirm the fix and to ensure no other error / defect appear.

<h2>Acceptance Criteria</h2>
- 100% Unit test passing for current functionality.
- Core flows (auth, email sending, XP assignment, etc.) pass without any critical fails.

<h2>Roles and Responsibilities</h2>
- <b>Writing Tests:</b> tests are written by whoever wrote the part of the codebase being tested.
- <b>Reviewing:</b> tests are reviewed by whoever has a stake in that part of the codebase or architecture layer (front-end / back-end).
- <b>Running CI:</b> tests are automatically ran (CI) when a PR is made to either the dev- or main-branch. These tests are ran by any team member with the overview of the collective team.
- <b>Fixing Errors / Defects:</b> any errors / defects are fixed by the whoever created that part of the codebase.
