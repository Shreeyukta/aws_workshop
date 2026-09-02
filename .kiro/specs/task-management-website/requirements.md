# Requirements Document

## Introduction

A task management website that enables users to create, organize, track, and complete tasks. The system provides a web-based interface for managing personal and team tasks with support for priorities, due dates, status tracking, and categorization. The goal is to give users a clear view of their workload and help them stay productive.

## Glossary

- **System**: The task management web application as a whole.
- **User**: An authenticated person interacting with the System.
- **Task**: A discrete unit of work with a title, optional description, status, priority, and optional due date.
- **Task_List**: A named collection of Tasks belonging to a User.
- **Status**: The current state of a Task — one of: `To Do`, `In Progress`, or `Done`.
- **Priority**: The urgency level of a Task — one of: `Low`, `Medium`, or `High`.
- **Dashboard**: The main landing page showing a summary of the User's tasks.
- **Auth_Service**: The component responsible for user registration, login, and session management.
- **Task_Service**: The component responsible for creating, reading, updating, and deleting Tasks.
- **Validator**: The component responsible for validating input data before it is persisted.

---

## Requirements

### Requirement 1: User Registration and Login

**User Story:** As a new visitor, I want to register an account and log in, so that I can access my personal tasks securely.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a registration form that collects a unique email address and a password of at least 8 characters.
2. WHEN a User submits a registration form with valid data, THE Auth_Service SHALL create a new account and redirect the User to the Dashboard.
3. IF a User submits a registration form with an email address that is already registered, THEN THE Auth_Service SHALL display an error message indicating the email is already in use.
4. IF a User submits a registration form with a password shorter than 8 characters, THEN THE Validator SHALL display an inline error message before the form is submitted.
5. WHEN a registered User submits valid login credentials, THE Auth_Service SHALL create an authenticated session and redirect the User to the Dashboard.
6. IF a User submits invalid login credentials, THEN THE Auth_Service SHALL display a generic error message and SHALL NOT reveal which field is incorrect.
7. WHEN an authenticated User requests to log out, THE Auth_Service SHALL invalidate the session and redirect the User to the login page.

---

### Requirement 2: Task Creation

**User Story:** As an authenticated User, I want to create tasks with details, so that I can track work I need to complete.

#### Acceptance Criteria

1. WHEN an authenticated User submits a new Task form with a non-empty title, THE Task_Service SHALL persist the Task and display it in the active Task_List.
2. THE Task_Service SHALL assign a default Status of `To Do` to every newly created Task.
3. THE Task_Service SHALL assign a default Priority of `Medium` to every newly created Task unless the User specifies otherwise.
4. WHERE a User provides a due date, THE Task_Service SHALL store the due date and display it on the Task.
5. IF a User submits a new Task form with an empty title, THEN THE Validator SHALL display an inline error message and SHALL NOT persist the Task.
6. WHEN a Task is successfully created, THE System SHALL display the new Task without requiring a full page reload.

---

### Requirement 3: Task Viewing and Dashboard

**User Story:** As an authenticated User, I want to see all my tasks on a dashboard, so that I can understand my workload at a glance.

#### Acceptance Criteria

1. WHEN an authenticated User navigates to the Dashboard, THE System SHALL display all Tasks belonging to that User.
2. THE Dashboard SHALL display each Task's title, Status, Priority, and due date (when present).
3. THE Dashboard SHALL display a summary count of Tasks grouped by Status (`To Do`, `In Progress`, `Done`).
4. WHILE a User is viewing the Dashboard, THE System SHALL allow the User to filter Tasks by Status, Priority, or due date.
5. WHILE a User is viewing the Dashboard, THE System SHALL allow the User to sort Tasks by due date, Priority, or creation date.
6. WHERE a User has no Tasks, THE Dashboard SHALL display an empty-state message prompting the User to create a first Task.

---

### Requirement 4: Task Editing and Status Updates

**User Story:** As an authenticated User, I want to edit tasks and update their status, so that I can keep my task list accurate as work progresses.

#### Acceptance Criteria

1. WHEN an authenticated User opens an existing Task, THE System SHALL display an edit form pre-populated with the Task's current data.
2. WHEN a User submits an edit form with valid data, THE Task_Service SHALL update the Task and reflect the changes immediately in the Dashboard.
3. IF a User submits an edit form with an empty title, THEN THE Validator SHALL display an inline error message and SHALL NOT persist the changes.
4. WHEN a User changes a Task's Status, THE Task_Service SHALL persist the new Status and update the Dashboard summary counts immediately.
5. WHEN a User changes a Task's Priority, THE Task_Service SHALL persist the new Priority.
6. WHEN a User sets a Task's Status to `Done`, THE System SHALL visually distinguish the Task from incomplete Tasks (e.g., strikethrough or muted styling).

---

### Requirement 5: Task Deletion

**User Story:** As an authenticated User, I want to delete tasks I no longer need, so that my task list stays relevant.

#### Acceptance Criteria

1. WHEN an authenticated User requests to delete a Task, THE System SHALL display a confirmation prompt before deletion.
2. WHEN a User confirms a deletion, THE Task_Service SHALL permanently remove the Task and remove it from the Dashboard without a full page reload.
3. IF a User cancels the deletion prompt, THEN THE Task_Service SHALL retain the Task unchanged.

---

### Requirement 6: Task Lists / Categories

**User Story:** As an authenticated User, I want to organize tasks into named lists, so that I can separate different areas of my life or work.

#### Acceptance Criteria

1. THE System SHALL allow a User to create, rename, and delete Task_Lists.
2. WHEN a User creates a Task, THE System SHALL allow the User to assign it to an existing Task_List.
3. WHILE a User is viewing a specific Task_List, THE System SHALL display only Tasks belonging to that Task_List.
4. IF a User deletes a Task_List that contains Tasks, THEN THE System SHALL prompt the User to confirm, indicating how many Tasks will also be deleted.
5. WHERE a Task is not assigned to any Task_List, THE System SHALL place it in a default list named `Inbox`.

---

### Requirement 7: Data Persistence and Security

**User Story:** As a User, I want my tasks to be saved reliably and accessible only to me, so that my data is secure and available across sessions.

#### Acceptance Criteria

1. THE Task_Service SHALL persist all Task data to a durable storage layer so that Tasks survive page refreshes and browser restarts.
2. WHILE a User is authenticated, THE System SHALL ensure that API requests for Tasks only return Tasks belonging to that User.
3. IF an unauthenticated request is made to a protected Task endpoint, THEN THE System SHALL return an HTTP 401 response.
4. IF an authenticated User requests a Task belonging to a different User, THEN THE System SHALL return an HTTP 403 response.
5. THE Auth_Service SHALL store passwords using a one-way cryptographic hash and SHALL NOT store plaintext passwords.

---

### Requirement 8: Responsive Design

**User Story:** As a User, I want to access the task management website from a desktop or mobile browser, so that I can manage my tasks from any device.

#### Acceptance Criteria

1. THE System SHALL render all pages correctly on viewport widths from 320px to 2560px.
2. WHILE a User is viewing the Dashboard on a viewport narrower than 768px, THE System SHALL display Tasks in a single-column layout.
3. THE System SHALL ensure all interactive elements (buttons, form fields, links) meet a minimum touch target size of 44×44 CSS pixels on mobile viewports.
