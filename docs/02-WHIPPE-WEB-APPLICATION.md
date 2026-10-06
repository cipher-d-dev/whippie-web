# Whippe Web — Application Specification

## 1. Purpose

Whippe Web is the shared application for HR/Admin and Supervisors.

It is a single Next.js application with role-aware navigation and authorization.

---

# 2. Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts when meaningful

### API

The Web application consumes the shared Express API.

It must not contain a second backend or direct database connection.

---

# 3. Roles

## Admin

System-level administrative access where required.

## HR

Full intern-management operations.

## Supervisor

Operational access limited to assigned interns and supervisor responsibilities.

## Intern

Intern functionality belongs primarily to the PWA.

---

# 4. HR Functionality

## Dashboard

Operational summary:

- active interns
- onboarding exceptions
- missing documents
- attendance exceptions
- overdue tasks
- pending evaluations
- upcoming internship endings

The dashboard should favour actionable information over decorative charts.

## Interns

HR can:

- create intern
- edit intern
- search
- filter
- view profile
- view internship dates
- assign department
- assign supervisor
- view status
- view timeline
- complete/deactivate internship

## Onboarding

Track:

- acceptance
- guarantor documentation
- identification
- school/NYSC information
- required forms
- digital upload
- physical document receipt
- verification

## Documents

- upload
- download
- status
- paper/digital tracking
- history
- standard document generation where approved
- printing

## Supervisors

- create/manage supervisor profiles
- assign interns
- reassign interns
- view workload
- see assignment history

## Attendance

- date filters
- intern filters
- department filters
- successful check-ins
- rejected attempts
- flagged attempts
- verification details
- manual correction

## Tasks

HR has visibility into overall task activity without needing to micromanage every task.

## Reports

HR can review submitted reports and relevant evidence.

## Evaluations

HR can see supervisor evaluations and final performance evidence.

## Exit

Track:

- internship end date
- final evaluation
- outstanding tasks
- outstanding documents
- final report
- completion status
- certificate/completion document status where applicable

---

# 5. Supervisor Functionality

Supervisors use the same Web application.

## Supervisor Dashboard

- assigned interns
- outstanding tasks
- recent submissions
- pending reviews
- attendance concerns
- upcoming internship endings

## My Interns

Supervisors can view their assigned interns.

## Tasks

- create
- assign
- describe
- set deadline
- review
- give feedback
- request changes
- mark complete

## Reports

- view
- review
- comment/feedback

## Evaluations

- complete structured evaluation
- submit evaluation
- view relevant previous evaluation state where permitted

---

# 6. Navigation

Initial HR navigation:

```text
Dashboard
Interns
Onboarding
Attendance
Tasks
Reports
Supervisors
Documents
Evaluations
Exit / Completion
Settings
```

Initial Supervisor navigation:

```text
Dashboard
My Interns
Tasks
Reports
Evaluations
```

Do not implement every route at once.

---

# 7. Permission Principles

HR can manage organisation-wide intern operations.

Supervisors can manage only assigned interns unless explicitly granted broader permission.

Backend authorization is mandatory.

The UI must never be the only security boundary.

---

# 8. UX Principles

- Desktop-first for HR
- Responsive
- Clear tables
- Search/filter where lists become large
- Useful empty states
- Clear error messages
- Minimal unnecessary animation
- Fast navigation
- No fake analytics

---

# 9. First Useful Release

The Web application should eventually allow:

> HR creates intern → onboarding is tracked → supervisor is assigned → intern becomes active → work/attendance is monitored → evaluation is completed → internship is closed.
