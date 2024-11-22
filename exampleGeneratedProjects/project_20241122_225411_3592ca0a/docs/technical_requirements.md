# Technical Requirements

# Technical Specifications Document for To-Do App

---

## 1. Technology Stack

### Frontend
- **Framework**: React.js (v17.0.2)
- **UI Library**: Material-UI (v5.0.0)
- **State Management**: React Hooks
- **Routing**: React Router (v5.2.0)
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js (Node.js)
- **Authentication**: JSON Web Tokens (JWT)
- **ORM**: Sequelize (Node.js)

### Database
- **Database System**: SQLite3
- **Schema Management**: Sequelize Migrations

### Other Tools
- **Version Control**: Git/GitHub
- **Package Manager**: npm
- **Linting and Formatting**: ESLint, Prettier
- **Testing Framework**: Jest (for unit testing), React Testing Library

---

## 2. System Architecture

### Overview
The To-Do app follows a **client-server architecture** using a RESTful API. The React-based frontend communicates with the Express.js backend over HTTP, and the backend interacts with the SQLite3 database for data persistence.

### Component Interactions and Data Flow
1. **Frontend**: 
   - Displays tasks, categories, and forms for task and category management.
   - Sends HTTP requests to the backend using Axios.
   - Updates the UI based on responses.

2. **Backend**: 
   - Receives API requests from the frontend.
   - Validates and processes data.
   - Interfaces with the database using Sequelize ORM.
   - Returns JSON responses to the frontend.

3. **Database**: 
   - Stores user data, tasks, and categories persistently.
   - Maintains relationships between users, tasks, and categories.

### Architecture Diagram
```
Frontend (React.js)
 ↕ (HTTP Requests via Axios)
Backend (Express.js)
 ↕ (Database Queries via Sequelize)
Database (SQLite3)
```

---

## 3. Data Models

### 3.1. User
| Attribute    | Data Type  | Constraints               |
|--------------|------------|---------------------------|
| UserID       | Integer    | Primary Key, AutoIncrement |
| Name         | String     | Not Null                 |
| Email        | String     | Unique, Not Null         |
| Password     | String     | Not Null                 |

**Relationships**:
- A `User` has many `Tasks`.
- A `User` has many `Categories`.

---

### 3.2. Task
| Attribute    | Data Type  | Constraints               |
|--------------|------------|---------------------------|
| TaskID       | Integer    | Primary Key, AutoIncrement |
| Title        | String     | Not Null                 |
| Description  | String     | Optional                 |
| DueDate      | Date       | Optional                 |
| Priority     | Enum       | Values: High, Medium, Low |
| Status       | Enum       | Values: Pending, In Progress, Completed |
| CategoryID   | Integer    | Foreign Key (Categories) |
| UserID       | Integer    | Foreign Key (Users)      |

**Relationships**:
- A `Task` belongs to one `User`.
- A `Task` belongs to one `Category`.

---

### 3.3. Category
| Attribute    | Data Type  | Constraints               |
|--------------|------------|---------------------------|
| CategoryID   | Integer    | Primary Key, AutoIncrement |
| Name         | String     | Not Null                 |
| UserID       | Integer    | Foreign Key (Users)      |

**Relationships**:
- A `Category` belongs to one `User`.
- A `Category` has many `Tasks`.

---

## 4. API Specifications

### 4.1. Authentication Endpoints
#### POST `/auth/signup`
- **Request**: 
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
- **Response**:
  - Success: `{ "message": "User created successfully" }` (201)
  - Error: `{ "error": "Email already exists" }` (400)

#### POST `/auth/login`
- **Request**: 
  - Body: `{ "email": "john@example.com", "password": "password123" }`
- **Response**:
  - Success: `{ "token": "jwt-token" }` (200)
  - Error: `{ "error": "Invalid credentials" }` (401)

---

### 4.2. Task Endpoints
#### GET `/tasks`
- **Description**: Fetch all tasks for the logged-in user.
- **Authentication**: Required (JWT Bearer Token).
- **Response**:
  - Success: `[{ "TaskID": 1, "Title": "Task 1", ... }]` (200)

#### POST `/tasks`
- **Description**: Create a new task.
- **Authentication**: Required.
- **Request**:
  - Body: `{ "title": "New Task", "description": "...", "categoryID": 1, "priority": "High", "status": "Pending" }`
- **Response**:
  - Success: `{ "message": "Task created successfully" }` (201)

---

### 4.3. Category Endpoints
#### GET `/categories`
- **Description**: Fetch all categories for the logged-in user.
- **Authentication**: Required.
- **Response**:
  - Success: `[{ "CategoryID": 1, "Name": "Work", ... }]` (200)

#### POST `/categories`
- **Description**: Create a new category.
- **Authentication**: Required.
- **Request**:
  - Body: `{ "name": "Personal" }`
- **Response**:
  - Success: `{ "message": "Category created successfully" }` (201)

---

## 5. UI Component Specifications

### Component List
1. **LoginForm**: Handles user login and sign-up.
   - Props: `onSubmit()`
   - State: `email`, `password`
   - Events: `onSubmit`
2. **TaskList**: Displays tasks grouped by categories.
   - Props: `tasks`, `categories`, `onEdit()`, `onDelete()`
   - Events: `onClick`, `onFilter`
3. **TaskForm**: Form for task creation/editing.
   - Props: `task`, `onSubmit()`
   - State: `title`, `description`, `dueDate`, `priority`, `status`, `categoryID`
4. **CategoryList**: Displays and manages categories.

### Component Hierarchy
```
App
├── LoginForm
├── Dashboard
│   ├── TaskList
│   │   ├── TaskItem
│   ├── CategoryList
├── TaskForm
```

---

## 6. Security and Compliance

### Authentication
- **Mechanism**: JSON Web Tokens (JWT).
- **Storage**: Tokens stored in `localStorage`.

### Data Protection
- Passwords hashed using bcrypt.
- HTTPS enforced for communication.

---

## 7. Coding Standards and Conventions

### Standards
- **Code Style**: Airbnb JavaScript Style Guide.
- **Naming**: CamelCase for variables and functions, PascalCase for React components.

### Tools
- Linting: ESLint.
- Formatting: Prettier.

---

## 8. Dependencies and Libraries

### Required Libraries
- **Frontend**: React, Material-UI, Axios, React Router.
- **Backend**: Express, Sequelize, bcrypt, JWT.
- **Testing**: Jest, React Testing Library.

### Avoided Libraries
- Avoid using outdated libraries or frameworks without support.

---

## 9. Other Technical Details
- **Environment Variables**: Use `.env` file to manage sensitive data like JWT secret.
- **Deployment**: Host frontend on Netlify and backend on Heroku.

---

This document outlines the technical specifications for a functional, scalable, and secure To-Do application. Further iterations may refine these specifications.