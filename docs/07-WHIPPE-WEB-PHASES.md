# Whippe Web — Incremental Build Phases

This is the primary build plan for `apps/web` and the backend capabilities consumed by it.

Each phase is deliberately explicit so an agentic CLI can implement one phase without guessing.

---

# PHASE 0 — Repository and Architecture Scaffolding

## Objective

Create a clean, runnable monorepo and establish the architectural conventions used by every later phase.

## Do Not Build Yet

Do not build:

- intern management
- attendance
- tasks
- reports
- evaluations
- document workflows
- AI

Only foundation/scaffolding belongs here.

## Repository

Create:

```text
whippe/
├── apps/
│   ├── api/
│   ├── web/
│   └── intern-pwa/
├── packages/
│   └── shared/
├── docs/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── .env.example
└── README.md
```

## API Scaffolding

Create:

```text
apps/api/src/
├── config/
├── middleware/
├── modules/
├── lib/
├── utils/
├── app.ts
└── server.ts
```

Create initial modules only where foundation requires them:

```text
modules/auth/
modules/users/
```

Do not create every future module yet.

## Web Scaffolding

Create:

```text
apps/web/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
├── lib/
├── hooks/
└── types/
```

Create the application shell and a placeholder protected dashboard.

## PWA Scaffolding

Create the basic PWA structure from `04-WHIPPE-PROJECT-STRUCTURE.md`, but do not build intern features.

## Shared Package

Create:

```text
packages/shared/
├── src/
│   ├── types/
│   ├── schemas/
│   └── constants/
└── package.json
```

Only put genuinely shared code here.

## Configuration

Set up:

- TypeScript
- pnpm workspaces
- linting/formatting convention
- environment loading
- API base URL convention
- MongoDB configuration
- development scripts

## Database

Create MongoDB connection infrastructure.

Do not create all business collections yet.

## API Foundation

Create:

- Express app
- JSON parsing
- CORS appropriate to local clients
- error middleware
- 404 middleware
- health endpoint
- environment validation

Example:

```text
GET /health
```

## Definition of Done

- `pnpm install` works
- all three apps can start
- API connects to MongoDB
- `/health` works
- Web renders
- PWA renders
- shared package can be imported
- environment variables are documented
- no secrets are committed

---

# PHASE 1 — Authentication, Account Lifecycle and HR Verification

## Objective

Establish real authentication and the account lifecycle that connects DAAR Communications' physical screening process to Whippe.

This phase must distinguish:

1. authentication identity,
2. pending HR verification,
3. verified/active account,
4. internship/onboarding status.

## Physical Screening Context

The intern completes DAAR Communications' physical screening before creating a Whippe account. Whippe does not replace physical screening.

HR verifies accounts by visually matching the intern's name and email against the screened intern list at their desk. No formal screening reference number or additional identifier is required.

## Backend Modules

Expand:

```text
apps/api/src/modules/auth/
apps/api/src/modules/users/
```

Create `modules/account-verification/` only if the verification workflow becomes sufficiently complex to justify a separate domain module.

## Account Data

Support:

```text
name
email
passwordHash              # manual auth where applicable
role
accountStatus
createdAt
updatedAt
verificationExpiresAt
verifiedAt
verifiedBy
rejectedAt
rejectedBy
```

Account states:

```text
PENDING_HR_VERIFICATION
ACTIVE
REJECTED
```

Do not put internship lifecycle state in `accountStatus`.

## Internship Status

The intern record has its own lifecycle, for example:

```text
SCREENED
ONBOARDING
ACTIVE
COMPLETED
```

The final values must reflect DAAR Communications' confirmed process.

## Signup Paths

### Google

```text
Google authentication
        ↓
Whippe account created/linked
        ↓
PENDING_HR_VERIFICATION
```

### Manual

```text
Email + password + required information
        ↓
Whippe account created
        ↓
PENDING_HR_VERIFICATION
```

Google authentication does **not** automatically verify the account with DAAR Communications.

## Pending Account

A pending account may only:

- authenticate
- see verification status
- provide permitted profile information
- log out

It must not use normal active-intern functionality.

## HR Verification Queue

HR/Admin can:

- list pending accounts
- inspect submitted information
- associate/match the account to the appropriate screened intern where required
- approve
- reject
- see verification timestamp/user

Approval changes the account to `ACTIVE`.

Rejection blocks normal intern access.

## 30-Day Expiry

When the account is created:

```text
verificationExpiresAt = createdAt + 30 days
```

If it remains pending beyond that point:

```text
PENDING_HR_VERIFICATION
        ↓
expired
        ↓
automatic deletion
```

The rule is enforced by the backend, not the frontend. The cleanup process must be safe to run repeatedly.

## API

Minimum endpoints:

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me

GET  /hr/account-verifications/pending
GET  /hr/account-verifications/:id
POST /hr/account-verifications/:id/approve
POST /hr/account-verifications/:id/reject
```

Google OAuth routes follow the selected auth implementation.

Do not expose any client-controlled field that can directly set `accountStatus = ACTIVE`.

## Web Files

Add:

```text
features/auth/
features/account-verification/
app/(auth)/login/
app/(dashboard)/account-verifications/
```

Build:

- pending-account table
- account review/detail
- approve action
- reject action
- verification/expiry information

## Security

The backend must enforce:

- only HR/Admin can approve
- clients cannot self-approve
- Google identity is not DAAR Communications verification
- pending users cannot access active-intern APIs
- expired pending accounts cannot continue as active users
- approval/rejection is auditable

## Tests

At minimum:

- manual signup creates pending account
- Google signup creates/links pending account
- pending account cannot access active-intern routes
- HR can list pending accounts
- HR can approve
- HR can reject
- supervisor cannot approve
- intern cannot approve
- approved account gains active access
- rejected account remains blocked
- expiry timestamp is correct
- expired pending account is deleted
- verified account is not deleted by pending cleanup
- client cannot forge active status

## Definition of Done

This complete flow works:

```text
physical screening
      ↓
Google/manual account creation
      ↓
PENDING_HR_VERIFICATION
      ↓
HR approval
      ↓
ACTIVE ACCOUNT
```

and:

```text
pending for 30 days
      ↓
automatic deletion
```

is enforced server-side.

---

# PHASE 2 — Intern Records

## Objective

HR can create and manage the central intern record.

## Backend

Create:

```text
modules/interns/
```

Likely:

```text
intern.model.ts
intern.schema.ts
intern.service.ts
intern.controller.ts
intern.routes.ts
intern.types.ts
```

## Intern Data

Initial fields should cover:

- user/account reference where applicable
- name/basic identity
- contact information
- school
- course/discipline
- internship type
- start date
- end date
- status
- department reference
- supervisor reference
- created/updated timestamps

Do not add sensitive fields without a requirement.

## API

Implement CRUD appropriate to HR:

```text
POST   /interns
GET    /interns
GET    /interns/:id
PATCH  /interns/:id
```

Support:

- pagination
- search
- useful filters

## Web Files

Add:

```text
features/interns/
app/(dashboard)/interns/
```

Build:

- intern list
- search/filter
- create form
- detail page
- edit form
- status display

## Permissions

HR/Admin can manage.

Supervisor can only access interns assigned to them once assignment exists.

## Tests

- create
- update
- retrieve
- search/filter
- unauthorized modification
- invalid data
- pagination

## Definition of Done

HR can create an intern, see them in the list and open/edit the intern record.

---

# PHASE 3 — Departments, Placements and Supervisor Assignment

## Objective

Give intern records organisational context and connect interns to supervisors.

## Backend Modules

Create:

```text
modules/departments/
modules/supervisors/
modules/placements/
```

Use the same module convention.

## Department

Minimum:

- name
- description/status where needed

## Supervisor

Supervisor should connect to a User account/staff identity.

Minimum useful information:

- user reference
- department where applicable
- active status

## Assignment

Support:

- assign
- reassign
- current assignment
- assignment history where useful

Do not destroy historical relationships unnecessarily.

## API

Examples:

```text
GET  /departments
POST /departments

GET  /supervisors
GET  /supervisors/:id/interns

POST /interns/:id/supervisor
PATCH /interns/:id/supervisor
```

Exact routes may follow the existing API convention.

## Web

Add:

```text
features/supervisors/
features/departments/
features/placements/
app/(dashboard)/supervisors/
```

Intern profile should show:

- department
- current supervisor
- placement

Supervisor page should show:

- assigned intern count
- assigned interns

## Permissions

HR/Admin manages assignments.

Supervisor sees only assigned interns.

## Tests

- assign
- reassign
- unauthorized assignment
- supervisor access boundary
- inactive supervisor handling

## Definition of Done

HR can assign a supervisor and that supervisor can see the assigned intern.

---

# PHASE 4 — Onboarding and Documents

## Objective

Digitally track onboarding while supporting DAAR Communications' paper process.

## Backend Modules

Create:

```text
modules/documents/
```

Add onboarding logic to the intern domain or create a small onboarding service/module if complexity requires it.

## Models

Introduce:

- DocumentRequirement
- Document

Track:

- requirement
- intern
- digital file
- physical status
- verification status
- uploaded time
- verified time
- reviewer

## Object Storage

Integrate the agreed S3-compatible storage provider.

The API should issue controlled upload/download access rather than exposing storage credentials.

## API

Examples:

```text
GET  /interns/:id/onboarding
PATCH /interns/:id/onboarding

GET  /interns/:id/documents
POST /interns/:id/documents
GET  /documents/:id
PATCH /documents/:id
```

## Web

Create:

```text
features/onboarding/
features/documents/
app/(dashboard)/onboarding/
app/(dashboard)/documents/
```

Build:

- onboarding checklist
- document list
- upload
- physical document status
- verification
- download

## Permissions

HR/Admin:

- full access

Supervisor:

- only documents explicitly appropriate to supervision

Intern:

- later through PWA

## Tests

- document upload metadata
- unauthorized document access
- physical/digital status
- verification
- file access control

## Definition of Done

HR can see an intern's complete onboarding state and identify missing physical/digital requirements.

---

# PHASE 5 — Supervisor Workspace

## Objective

Make the Supervisor role usable as a real operational user.

## Web

Create/extend:

```text
app/(dashboard)/supervisor/
features/supervisor/
```

Use role-aware dashboard routing rather than creating a second Web application.

## Supervisor Dashboard

Show:

- assigned intern count
- intern list
- pending work
- recent activity
- relevant attendance status once attendance exists

Do not show future data that does not exist yet.

## Intern Detail

Supervisor can see information needed for supervision.

Hide:

- unrelated HR-only data
- private HR notes
- organisation-wide administrative controls

## Backend

Harden supervisor ownership checks.

Every endpoint must verify that the supervisor is actually allowed to access the intern.

## Tests

- supervisor sees assigned intern
- supervisor cannot access another supervisor's intern
- HR still has access
- direct API access is protected

## Definition of Done

A supervisor can log in and manage their own workspace without receiving HR access.

---

# PHASE 6 — Tasks and Submissions

## Objective

Create the first real work loop between supervisor and intern.

## Backend Modules

Create:

```text
modules/tasks/
modules/submissions/
```

## Task

Minimum:

- title
- description
- creator
- assigned intern
- supervisor
- deadline
- status
- created/updated timestamps

## Submission

Minimum:

- task reference
- intern
- content/file reference where appropriate
- submitted time
- status
- feedback
- reviewed time

## Statuses

Keep statuses simple, for example:

```text
todo
in_progress
submitted
changes_requested
completed
```

Do not create a complex workflow engine.

## API

Examples:

```text
POST  /tasks
GET   /tasks
GET   /tasks/:id
PATCH /tasks/:id

POST  /tasks/:id/submissions
GET   /tasks/:id/submissions
POST  /submissions/:id/feedback
```

## Web

Build:

- supervisor task creation
- task list
- task detail
- submission review
- feedback
- status updates

## PWA Dependency

The PWA will consume this API in its Task phase.

Do not create intern-specific backend logic in the PWA.

## Tests

- supervisor creates task for assigned intern
- supervisor cannot assign another supervisor's intern
- intern can submit only their own task
- supervisor can review assigned intern submission
- unauthorized submission access fails

## Definition of Done

Supervisor creates task → intern can later receive it through PWA → intern submission can be reviewed in Web.

---

# PHASE 7 — Reports and Evaluations

## Objective

Create structured evidence of intern work.

## Backend Modules

Create:

```text
modules/reports/
modules/evaluations/
```

## Reports

Initial report types:

- daily
- weekly
- final

Keep scheduling rules simple initially.

## Evaluation

Use a structured form rather than free-form judgement only.

Potential categories:

- task/work quality
- reliability
- communication
- learning/progress
- professionalism

Exact criteria should be confirmed with DAAR Communications before finalising.

## Web

Build:

- report review
- report history
- evaluation form
- evaluation submission
- HR evaluation view

## PWA Dependency

Intern report submission is implemented in the PWA Phase 4.

## Tests

- report ownership
- supervisor review
- evaluation permissions
- duplicate/invalid submissions
- HR visibility

## Definition of Done

A supervisor can review work evidence and submit an evaluation that HR can access.

---

# PHASE 8 — Attendance Monitoring

## Objective

Provide HR with attendance records and verification results.

## Backend

Create:

```text
modules/attendance/
```

Model should support:

- intern
- date/time
- coordinates where collected
- accuracy
- verification method
- result
- risk/flags
- network metadata where legally/technically appropriate
- manual correction metadata

## API

Examples:

```text
POST /attendance/check-in
GET  /attendance
GET  /attendance/:id
PATCH /attendance/:id
```

The PWA initiates check-in.

The API performs verification.

## Verification

Initial concepts:

1. authenticated user
2. timestamp
3. location/geofence
4. location accuracy
5. optional rotating QR
6. network/IP risk
7. available device/browser signals
8. flag suspicious combinations

Do not promise perfect VPN, proxy or GPS spoof detection.

## Web

Build:

```text
features/attendance/
app/(dashboard)/attendance/
```

Views:

- daily attendance
- intern history
- flagged attempts
- manual correction

## Tests

Test:

- valid check-in
- outside geofence
- poor accuracy
- expired/invalid QR
- duplicate check-in
- suspicious/flagged attempt
- HR correction
- intern cannot modify own attendance result

## Definition of Done

Attendance produced by the PWA can be reliably viewed and managed by HR.

---

# PHASE 9 — Internship Exit and Completion

## Objective

Close the intern lifecycle.

## Backend

Extend intern/placement/exit logic.

Track:

- end date
- completion state
- final report
- final evaluation
- outstanding documents
- outstanding tasks
- certificate/completion status

## Web

Create:

```text
features/exit/
app/(dashboard)/exit/
```

Build:

- upcoming endings
- intern completion checklist
- outstanding items
- completion action
- completion status

## Rules

Do not allow accidental completion if critical required items remain unless HR explicitly overrides.

## Tests

- upcoming end
- incomplete checklist
- completion
- unauthorized completion
- completion visibility

## Definition of Done

HR can identify interns nearing completion and close an internship through an explicit workflow.

---

# PHASE 10 — Document Generation and Operational Printing

## Objective

Reduce repetitive document preparation.

## Build

Only after DAAR Communications confirms actual templates/requirements.

Potential documents:

- acceptance letter
- intern record
- attendance summary
- report summary
- completion/certificate document

## Backend

Create a document-generation service rather than putting PDF logic inside controllers.

## Web

Add:

- generate
- preview where useful
- download
- print

## Important

Do not invent official DAAR Communications document wording.

Templates must come from approved DAAR Communications content.

## Definition of Done

Approved templates can be generated from intern data and printed without manual retyping.

---

# PHASE 11 — Notifications

## Objective

Reduce manual HR/supervisor follow-up.

## Backend

Create:

```text
modules/notifications/
```

Model:

- recipient
- type
- title
- body
- read state
- related entity
- timestamp

## Initial notifications

- task assigned
- feedback received
- report reminder
- missing document
- attendance issue
- internship ending

## Web

Add notification indicator/panel.

## PWA

Consumes the same notification system.

## Optional Later

Push notifications.

Do not add Redis/BullMQ just to send a few in-app notifications.

---

# PHASE 12 — Security and Hardening

## Objective

Prepare the system for real internal use.

## Backend

Review:

- authentication
- authorization
- validation
- rate limiting
- secure headers
- CORS
- file access
- audit logging
- sensitive error messages
- session/token handling

## Audit

Create:

```text
modules/audit/
```

if audit logic has become substantial; otherwise keep it as a service.

Log important actions.

## Security Tests

Test:

- IDOR attempts
- role escalation
- document access
- supervisor boundary
- intern boundary
- invalid tokens
- malformed input
- rate limits

## Definition of Done

The system has been tested as an internal application rather than merely as a happy-path prototype.

---

# PHASE 13 — HR Dashboard Refinement

## Objective

Make HR's dashboard genuinely useful.

## Metrics

Use real stored data:

- active interns
- onboarding exceptions
- attendance exceptions
- overdue tasks
- pending evaluations
- upcoming endings

## Charts

Only create charts that answer a question.

Examples:

- attendance trend
- intern status distribution
- onboarding completion

Avoid dashboard clutter.

---

# PHASE 14 — Optional AI

## Objective

Add AI only after the underlying workflows are useful.

## Potential features

- report summarization
- performance evidence summary
- report drafting assistance
- internal assistant

## Rules

- backend only
- permission-aware
- minimal data
- reviewable output
- no opaque final performance decisions

AI is not a blocker for the first production release.
