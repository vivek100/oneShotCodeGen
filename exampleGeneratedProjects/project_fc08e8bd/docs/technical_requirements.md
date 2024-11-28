# Technical Requirements

### **Technical Specifications Document for Todo Application**

---

### **Technology Stack**

#### **Frontend**
- **Framework:** React.js (v17.0.2)
- **UI Library:** Material-UI (v5.0.0)
- **State Management:** React Hooks
- **Routing:** React Router (v5.2.0)
- **HTTP Client:** Axios
- **Styling:** Material-UI with custom theming (for light/dark modes and color palettes)

#### **Backend**
- **Framework:** Express.js (Node.js v16.x)
- **Authentication:** JSON Web Tokens (JWT)
- **Data Management:** Sequelize ORM

#### **Database**
- **Database Engine:** SQLite3
- **ORM:** Sequelize (v6.x)

#### **Other Tools**
- **Version Control:** Git (GitHub repository)
- **Build Tool:** Webpack
- **Package Manager:** npm (Node Package Manager)
- **Testing Frameworks:**
  - Frontend: Jest (for unit tests), React Testing Library
  - Backend: Mocha, Chai
- **API Documentation:** Swagger (OpenAPI Specification)
- **Linting and Formatting:** ESLint (Airbnb style guide), Prettier

---

### **System Architecture**

#### **Architecture Overview**
The system follows a **Client-Server Architecture** with a RESTful API for communication between the frontend and backend. The main components include:

1. **Frontend (React.js):**
   - Renders the user interface.
   - Manages state and UI interactions.
   - Sends API requests to the backend for data operations.

2. **Backend (Express.js):**
   - Handles business logic and API endpoints.
   - Manages authentication via JWT.
   - Interacts with the SQLite database through Sequelize.

3. **Database (SQLite):**
   - Stores data persistently (tasks, categories, timestamps, etc.).
   - Ensures data integrity with primary and foreign key constraints.

#### **Component Interactions and Data Flow**
1. **Frontend:**
   - User interacts with the UI (e.g., creates a task).
   - Frontend sends an HTTP request to the backend via Axios.

2. **Backend:**
   - Receives the request and processes it (e.g., validates input, applies business logic).
   - Interacts with the database using Sequelize ORM.
   - Responds to the frontend with the result of the operation (e.g., the created task).

3. **Database:**
   - Stores and retrieves tasks, categories, and related metadata.
   - Enforces relationships and constraints.

---

### **Data Models**

#### **Task**
| **Attribute**       | **Type**          | **Constraints**                     |
|----------------------|-------------------|--------------------------------------|
| `id`                | Integer           | Primary Key, Auto-increment         |
| `title`             | String            | Not Null                            |
| `description`       | Text              | Optional                            |
| `dueDate`           | Date              | Optional                            |
| `priority`          | Enum (Low, Medium, High) | Default: Low                  |
| `status`            | Enum (To Do, In Progress, Completed) | Default: To Do |
| `createdAt`         | Timestamp         | Auto-generated                      |
| `updatedAt`         | Timestamp         | Auto-generated                      |

#### **Category/Tag**
| **Attribute**       | **Type**          | **Constraints**                     |
|----------------------|-------------------|--------------------------------------|
| `id`                | Integer           | Primary Key, Auto-increment         |
| `name`              | String            | Unique, Not Null                    |

#### **Relationships**
- A **Task** can belong to **multiple Categories/Tags** (many-to-many relationship).
- A **Category/Tag** can have multiple tasks.

---

### **API Specifications**

#### **Authentication**
- **Mechanism:** JSON Web Tokens (JWT)
- **Token Expiry:** 24 hours
- **Authorization Header:** `Authorization: Bearer <token>`

#### **Endpoints**
1. **Tasks**
   - **GET /api/tasks**
     - **Description:** Retrieve all tasks with optional filters and sorting.
     - **Query Parameters:**
       - `status`: Filter by task status.
       - `priority`: Filter by priority level.
       - `sortBy`: Sort by `dueDate`, `priority`, or `status`.
     - **Response:** JSON array of task objects.
     - **Status Codes:** 200 (OK), 401 (Unauthorized), 500 (Server Error)

   - **POST /api/tasks**
     - **Description:** Create a new task.
     - **Request Body:**
       ```json
       {
         "title": "Task Title",
         "description": "Optional description",
         "dueDate": "YYYY-MM-DD",
         "priority": "Low",
         "status": "To Do",
         "categories": [1, 2]
       }
       ```
     - **Response:** JSON object of the created task.
     - **Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized)

   - **PUT /api/tasks/:id**
     - **Description:** Update a specific task.
     - **Request Body:** Same as POST request.
     - **Response:** JSON object of the updated task.
     - **Status Codes:** 200 (OK), 404 (Not Found), 401 (Unauthorized)

   - **DELETE /api/tasks/:id**
     - **Description:** Delete a specific task.
     - **Response:** Success message.
     - **Status Codes:** 204 (No Content), 404 (Not Found), 401 (Unauthorized)

2. **Categories**
   - **GET /api/categories**
     - **Description:** Retrieve all categories.
     - **Response:** JSON array of category objects.
     - **Status Codes:** 200 (OK), 401 (Unauthorized)

   - **POST /api/categories**
     - **Description:** Create a new category.
     - **Request Body:**
       ```json
       {
         "name": "Work"
       }
       ```
     - **Response:** JSON object of the created category.
     - **Status Codes:** 201 (Created), 400 (Bad Request), 401 (Unauthorized)

---

### **UI Component Specifications**

#### **TaskList**
- **Props:** List of tasks, filters, sorting options.
- **State:** Active filters and sort order.
- **Events:** Edit task, delete task, mark as completed.

#### **TaskForm**
- **Props:** Task data (for editing).
- **State:** Form inputs (title, description, priority, etc.).
- **Events:** Save task, cancel.

#### **Component Hierarchy**
```
- App
  - Header
  - TaskList
    - TaskItem
  - TaskForm
  - CategoryManager
```

---

### **Security and Compliance**
- **Authentication:** JWT-based token authentication.
- **Authorization:** Role-based access control (basic user only).
- **Data Protection:**
  - SSL for secure data transmission.
  - Input validation to prevent SQL injection and XSS attacks.
- **Compliance:** No specific compliance requirements for this version.

---

### **Coding Standards and Conventions**
- **Style Guide:** Airbnb JavaScript Style Guide.
- **Linting:** ESLint with Prettier.
- **Testing:** Follow TDD (Test-Driven Development) principles.
- **Naming Conventions:**
  - Variables and functions: camelCase.
  - Components: PascalCase.
  - Constants: UPPER_SNAKE_CASE.

---

### **Dependencies and Libraries**
- **Frontend:** React, Material-UI, React Router, Axios.
- **Backend:** Express.js, Sequelize, JWT.
- **Testing:** Jest, React Testing Library, Mocha, Chai.
- **Documentation:** Swagger.

---

### **Other Technical Details**
- **Responsive Design:** Implemented using Material-UI’s Grid system.
- **Error Handling:** Centralized error middleware in Express.js.
- **Deployment:** Suitable for deployment on platforms like Heroku or Vercel. SQLite will be replaced with PostgreSQL in production.

---

This document outlines the technical specifications for the Todo application, ensuring clarity and alignment with the defined requirements. Future iterations can expand on scalability, security, and multi-user support.