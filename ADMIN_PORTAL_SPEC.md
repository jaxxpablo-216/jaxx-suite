Admin Portal — Feature Specification

## Context

This is a React + TypeScript + Firebase employee referral app. The `Admin` role has full access to all features. The existing `AdminPortal.tsx` has a **Users** tab with partial functionality — add user and issue token. This document defines the **complete, production-ready Admin user management experience**.

---

## Role & Access

- Role value in Firestore: `'Admin'`
- Route: `/admin` (protected to `HR Coordinator`, `HR Manager`, `Admin`)
- Admin-exclusive tabs: **Users**, **Audit Log**
- Existing tabs shared with lower roles: Overview, Referral Mgmt, Job Postings, Rewards

---

## Users Tab — Full Specification

### 1. User List / Table View

Display all employees from the `employees` Firestore collection in a searchable, sortable table with these columns:

| Column | Source Field | Notes |
|---|---|---|
| Employee ID | `employeeId` | Monospace, copyable |
| Name | `firstName + lastName` | |
| Role | `role` | Colored `<Badge>` using `ROLE_COLORS` |
| Department | `department` | |
| Status | `isActive` | Active (green) / Inactive (gray) badge |
| Token Status | `token`, `tokenExpiresAt` | Use existing `<TokenCountdown>` component |
| Actions | — | Edit, Issue Token, Deactivate/Activate, Delete |

- Search bar: filter by name, employeeId, or department
- Filter dropdown: by role, by status (active/inactive)
- Sort: by name, by department, by token expiry

---

### 2. Add New User (Create Employee)

Form fields mapped to the `Employee` type in `src/types/index.ts`:

```
employeeId      — text input, must be unique (validate against Firestore)
firstName       — text input, required
lastName        — text input, required
role            — select: Employee | HR Coordinator | HR Manager | Admin
department      — select from DEPARTMENTS constant
email           — text input, required, email format
phone           — text input, optional
position        — text input (job title), optional
isActive        — toggle, default true
```

- On submit: write to `employees` collection, write an `AuditLog` entry with `action: 'user_created'`, `actorId`, `actorName`, `targetId: employeeId`, timestamp
- Immediately offer to issue a token after creation (inline prompt or auto-advance to token modal)

---

### 3. Edit User Details

Inline edit modal (or slide-over panel) pre-populated with existing values. All fields from Add User are editable **except** `employeeId` (read-only after creation).

- On save: update Firestore document, write `AuditLog` entry with `action: 'user_updated'`, diff of changed fields stored in `details`
- Show which fields changed in the audit log entry

---

### 4. Delete User

- Soft-delete preferred: set `isActive: false` labeled as **Deactivate**
- Hard-delete option: permanently remove Firestore document, labeled **Delete** with a destructive confirmation dialog ("This cannot be undone. All referrals submitted by this employee will retain history but this account will be removed.")
- On either action: write `AuditLog` entry with `action: 'user_deactivated'` or `'user_deleted'`
- Deactivated users: login is blocked (already enforced in `src/services/auth.ts`)

---

### 5. Issue / Regenerate Token

Token issuance uses the existing utility in `src/utils/token.ts`.

Token modal fields:

```
Token Duration   — select: 7 days | 30 days | 90 days (default) | Custom date
Generated Token  — displayed read-only after creation, copyable with one click
Expiry Date      — auto-calculated and displayed
```

Logic:
- Generate token via existing `generateToken()` utility
- Set `token` and `tokenExpiresAt` on the employee document
- If the user already has an active token, show a warning: "This will invalidate their current token"
- Write `AuditLog` entry: `action: 'token_issued'`, include `tokenExpiresAt` in `details`
- Display token **once** in the modal with a copy button — do not persist the raw token value in UI state after modal closes (it's already in Firestore)

---

### 6. Token Display in Table

Use the existing `<TokenCountdown>` component (`src/components/common/TokenCountdown.tsx`):

- `5d+` → green
- `1–5 days` → yellow/warning
- `< 24h` → red/urgent
- `Expired` → gray, with "Re-issue" quick action button

---

## Audit Log Tab — Full Specification

Ensure all admin actions are captured with the following action keys:

| Action Key | Trigger |
|---|---|
| `user_created` | New employee added |
| `user_updated` | Employee fields changed |
| `user_deactivated` | isActive set to false |
| `user_deleted` | Document removed |
| `token_issued` | Token generated/regenerated |
| `referral_status_updated` | Status change on referral |
| `job_created` | New job posting |
| `job_updated` | Job posting edited |
| `reward_updated` | Reward config changed |

Display columns: Timestamp, Actor (name + role), Action, Target (employeeId or referral ID), Details (expandable).

---

## Data Service Layer

All Firestore operations go through `src/services/firestore.ts`. Add these functions if not already present:

```ts
createEmployee(data: Omit<Employee, 'createdAt'>): Promise<void>
updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void>
deleteEmployee(employeeId: string): Promise<void>
deactivateEmployee(employeeId: string): Promise<void>
issueToken(employeeId: string, token: string, expiresAt: string): Promise<void>
getAllEmployees(): Promise<Employee[]>
writeAuditLog(log: AuditLog): Promise<void>
```

---

## Permissions Summary

| Feature | HR Coordinator | HR Manager | Admin |
|---|---|---|---|
| View Users tab | — | — | Yes |
| Add user | — | — | Yes |
| Edit user | — | — | Yes |
| Deactivate user | — | — | Yes |
| Delete user | — | — | Yes |
| Issue token | — | — | Yes |
| View Audit Log | — | — | Yes |
