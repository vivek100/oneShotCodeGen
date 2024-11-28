# Functional Requirements

# Requirements Document for To-Do App

## Functional Requirements
### Core Functionalities
1. **Task Management**
   - Users can create tasks with the following attributes:
     - Title (required)
     - Description (optional)
     - Due date (optional)
     - Priority (e.g., High, Medium, Low)
     - Status (e.g., Pending, In Progress, Completed)
   - Users can edit task details (title, description, etc.).
   - Users can delete tasks.
   - Users can mark tasks as completed.
   - Tasks can be organized into categories or lists (e.g., Work, Personal).

2. **Categories/Lists Management**
   - Users can create, rename, or delete categories/lists to organize tasks.
   - Each task is associated with a category (default: Uncategorized).

3. **Task Filtering and Sorting**
   - Users can filter tasks by:
     - Status (e.g., show only completed or pending tasks).
     - Due date (e.g., overdue tasks, today’s tasks).
     - Priority (e.g., show only high-priority tasks).
   - Users can sort tasks by:
     - Due date (ascending/descending).
     - Priority (High to Low or vice versa).

4. **Search**
   - Users can search tasks by title or description.

5. **Basic Authentication**
   - Users can sign up and log in using:
     - Email and password.
   - Users’ data is linked to their accounts, ensuring privacy (but no advanced security measures for now).

6. **Data Persistence**
   - All tasks, categories, and user data are saved and retrievable across sessions.

### User Roles and Permissions
- **Standard User**:
  - Can create, edit, delete, and manage their own tasks and categories.
  - Can only access their own data (no collaboration or sharing features).

### Data Entities and Relationships
1. **User**
   - Attributes: UserID, Name, Email, Password
   - Relationship: A user has many tasks and many categories.
2. **Task**
   - Attributes: TaskID, Title, Description, DueDate, Priority, Status, CategoryID, UserID
   - Relationship: Each task belongs to one user and one category.
3. **Category**
   - Attributes: CategoryID, Name, UserID
   - Relationship: Each category belongs to one user and can have many tasks.

---

## User Interface (UI) and User Experience (UX) Requirements
### UI Components and Screens
1. **Login/Sign-Up Screen**
   - Fields: Email, Password.
   - Buttons for login and registration.

2. **Home Screen/Dashboard**
   - Displays a list of tasks organized by categories (default view).
   - Includes buttons for adding new tasks and new categories.
   - Displays filters and sorting options.

3. **Task Creation/Edit Screen**
   - Fields: Title, Description, DueDate, Priority, Category, Status.
   - Save and Cancel buttons.

4. **Category Management Screen**
   - List of categories.
   - Options to add, edit, or delete categories.

5. **Search Bar**
   - Persistent across appropriate screens.
   - Allows users to search for tasks by title or description.

6. **Task Detail View (Optional)**
   - Displays full details of a selected task.
   - Edit and delete options.

### Component Hierarchy Diagram
```
App
├── Login/Sign-Up Screen
├── Home Screen
│   ├── Header (Search Bar, Filters, Sorting)
│   ├── Task List (Grouped by Category)
│       ├── Task Item (Title, Status, Priority)
│   ├── Add Task Button
│   ├── Add Category Button
├── Task Creation/Edit Screen
├── Category Management Screen
```

### Menu and Navigation Paths
1. **Login → Home Screen (if authenticated)**
2. **Home Screen → Task Creation/Edit Screen**
3. **Home Screen → Category Management Screen**
4. **Home Screen → Task Detail View (optional)**

### Design Preferences
- Clean and minimalistic design.
- Use a neutral color palette (e.g., white, gray, and blue).
- Icons for actions (add, delete, edit) for better usability.

### Usability and Accessibility
- Clear labels and instructions for all input fields.
- Responsive design for compatibility with desktop and mobile devices.
- Ensure keyboard navigation and screen-reader compatibility for accessibility.

---

## User Flows
### Key User Flows
1. **Add a New Task**
   - User clicks "Add Task" → Task Creation Screen → Fills in details → Clicks "Save" → Task is displayed in the appropriate category.

2. **Edit a Task**
   - User selects a task → Task Detail View or Edit Screen → Updates details → Clicks "Save."

3. **Delete a Task**
   - User selects a task → Clicks "Delete" → Confirms deletion → Task is removed.

4. **Create a Category**
   - User clicks "Add Category" → Enters category name → Clicks "Save" → New category appears in the category list.

5. **Filter and Sort Tasks**
   - User applies filters or sorting options from the Home Screen → Task list updates dynamically.

### Example Flowchart: Add a New Task
```
[Home Screen] → [Click "Add Task"] → [Task Creation Screen] → [Fill Details] → [Click "Save"] → [Home Screen (Updated List)]
```

---

## Non-Functional Requirements
1. **Performance**
   - The app should load within 2 seconds on standard devices.
   - Task creation, editing, and deletion should take less than 1 second to process.

2. **Security**
   - Basic email/password authentication is sufficient.
   - No advanced security measures are required at this stage.

3. **Scalability**
   - The app should handle up to 500 users and 1,000 tasks per user without performance degradation.

4. **Reliability**
   - Ensure data persistence using a lightweight database (e.g., SQLite or Firebase).

5. **Compliance**
   - No specific compliance or regulatory requirements at this stage.

6. **User Types**
   - Single user type: Standard User.

---

## Constraints and Assumptions
### Constraints
- **Technological Constraints**:
  - Use a lightweight database (e.g., SQLite or Firebase).
  - Authentication should be implemented using standard libraries or frameworks.
- **Internal Tool**:
  - The application is intended for internal use only, so advanced security and compliance measures are not prioritized.

### Assumptions
- The app is not intended for collaboration or shared tasks among users.
- No integration with third-party services (e.g., AI or external APIs) is required at this stage.
- The authentication system is minimal, prioritizing functionality over security.
- The app will primarily be used on desktop and mobile web browsers, with no immediate need for native apps.

---

This document outlines the requirements for a simple yet functional to-do application. Further iterations or user feedback can refine and expand upon these requirements.