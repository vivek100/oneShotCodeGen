import type { AppConfig } from "../types/config"

const sampleConfigold: AppConfig = {
  app: {
    name: "MY Tool",
    description: "A modular internal tool app driven by configuration",
    version: "1.0.0",
    createdBy: "v0",
  },
  auth: {
    roles: ["Admin", "Manager", "Employee"],
    users: [
      {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "Admin",
      },
      {
        id: "2",
        name: "Manager User",
        email: "manager@example.com",
        password: "manager123",
        role: "Manager",
      },
      {
        id: "3",
        name: "Employee User",
        email: "employee@example.com",
        password: "employee123",
        role: "Employee",
      },
    ],
  },
  pages: [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/dashboard",
      icon: "bar-chart",
      showInSidebar: true,
      sidebarOrder: 1,
      layoutType: "default",
      zones: [
        {
          name: "metrics",
          components: [
            {
              type: "MetricCard",
              props: {
                title: "Total Employees",
                resource: "employees",
                field: "id",
                aggregate: "count",
                icon: "users",
              },
            },
            {
              type: "MetricCard",
              props: {
                title: "Total Departments",
                resource: "departments",
                field: "id",
                aggregate: "count",
                icon: "bar-chart",
                color: "green",
              },
            },
            {
              type: "MetricCard",
              props: {
                title: "Average Salary",
                resource: "employees",
                field: "salary",
                aggregate: "avg",
                icon: "dollar-sign",
                color: "purple",
              },
            },
          ],
        },
        {
          name: "charts",
          components: [
            {
              type: "Chart",
              props: {
                title: "Employees by Department",
                type: "bar",
                resource: "employees",
                xField: "department_name",
                yField: "id",
                transform: "count",
              },
            },
          ],
        },
        {
          name: "tables",
          components: [
            {
              type: "DataTable",
              props: {
                resource: "employees",
                columns: [
                  {
                    field: "name",
                    label: "Name",
                    type: "text",
                  },
                  {
                    field: "email",
                    label: "Email",
                    type: "text",
                  },
                  {
                    field: "department_id",
                    label: "Department",
                    type: "reference",
                    reference: {
                      resource: "departments",
                      displayField: "name",
                    },
                  },
                  {
                    field: "position",
                    label: "Position",
                    type: "text",
                  },
                  {
                    field: "salary",
                    label: "Salary",
                    type: "number",
                  },
                ],
                filters: [
                  {
                    field: "department_id",
                    label: "Department",
                    type: "select",
                    options: ["1", "2", "3"],
                  },
                ],
                pagination: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: true,
                formValidationRules: {
                  name: {
                    required: true,
                    minLength: 2,
                  },
                  email: {
                    required: true,
                    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: "testing",
      title: "Testing",
      path: "/testing",
      icon: "bar-chart",
      showInSidebar: true,
      sidebarOrder: 1,
      layoutType: "default",
      zones: [
        {
          name: "metrics",
          components: [
            {
              type: "MetricCard",
              props: {
                title: "Total Employees",
                resource: "employees",
                field: "id",
                aggregate: "count",
                icon: "users",
              },
            },
            {
              type: "MetricCard",
              props: {
                title: "Total Departments",
                resource: "departments",
                field: "id",
                aggregate: "count",
                icon: "bar-chart",
                color: "green",
              },
            },
            {
              type: "MetricCard",
              props: {
                title: "Average Salary",
                resource: "employees",
                field: "salary",
                aggregate: "avg",
                icon: "dollar-sign",
                color: "purple",
              },
            },
          ],
        },
        {
          name: "charts",
          components: [
            {
              type: "Chart",
              props: {
                title: "Employees by Department",
                type: "bar",
                resource: "employees",
                xField: "department_name",
                yField: "id",
                transform: "count",
              },
            },
          ],
        },
        {
          name: "tables",
          components: [
            {
              type: "DataTable",
              props: {
                resource: "employees",
                columns: [
                  {
                    field: "name",
                    label: "Name",
                    type: "text",
                  },
                  {
                    field: "email",
                    label: "Email",
                    type: "text",
                  },
                  {
                    field: "department_id",
                    label: "Department",
                    type: "reference",
                    reference: {
                      resource: "departments",
                      displayField: "name",
                    },
                  },
                  {
                    field: "position",
                    label: "Position",
                    type: "text",
                  },
                  {
                    field: "salary",
                    label: "Salary",
                    type: "number",
                  },
                ],
                filters: [
                  {
                    field: "department_id",
                    label: "Department",
                    type: "select",
                    options: ["1", "2", "3"],
                  },
                ],
                pagination: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: true,
                formValidationRules: {
                  name: {
                    required: true,
                    minLength: 2,
                  },
                  email: {
                    required: true,
                    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: "employees",
      title: "Employees",
      path: "/employees",
      icon: "users",
      showInSidebar: true,
      sidebarOrder: 2,
      layoutType: "tabs",
      zones: [
        {
          name: "List",
          components: [
            {
              type: "DataTable",
              props: {
                resource: "employees",
                columns: [
                  {
                    field: "name",
                    label: "Name",
                    type: "text",
                  },
                  {
                    field: "email",
                    label: "Email",
                    type: "text",
                  },
                  {
                    field: "department_id",
                    label: "Department",
                    type: "reference",
                    reference: {
                      resource: "departments",
                      displayField: "name",
                    },
                  },
                  {
                    field: "position",
                    label: "Position",
                    type: "text",
                  },
                  {
                    field: "salary",
                    label: "Salary",
                    type: "number",
                  },
                  {
                    field: "hire_date",
                    label: "Hire Date",
                    type: "date",
                  },
                ],
                pagination: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: true,
              },
            },
          ],
        },
        {
          name: "Add New",
          components: [
            {
              type: "WizardForm",
              props: {
                steps: [
                  {
                    title: "Basic Info",
                    fields: [
                      {
                        name: "name",
                        label: "Name",
                        type: "text",
                        required: true,
                      },
                      {
                        name: "email",
                        label: "Email",
                        type: "text",
                        required: true,
                      },
                    ],
                  },
                  {
                    title: "Job Details",
                    fields: [
                      {
                        name: "department_id",
                        label: "Department",
                        type: "reference",
                        reference: {
                          resource: "departments",
                          displayField: "name",
                        },
                        required: true,
                      },
                      {
                        name: "position",
                        label: "Position",
                        type: "text",
                        required: true,
                      },
                      {
                        name: "salary",
                        label: "Salary",
                        type: "number",
                        required: true,
                      },
                    ],
                  },
                  {
                    title: "Additional Info",
                    fields: [
                      {
                        name: "hire_date",
                        label: "Hire Date",
                        type: "date",
                        required: true,
                      },
                      {
                        name: "is_active",
                        label: "Active Employee",
                        type: "boolean",
                      },
                    ],
                  },
                ],
                resource: "employees",
                submitAction: "create",
                redirectPath: "/employees",
              },
            },
          ],
        },
        {
          name: "Analytics",
          components: [
            {
              type: "TabsComponent",
              props: {
                layout: "horizontal",
                loadOnClick: true,
                tabs: [
                  {
                    title: "Salary Distribution",
                    component: {
                      type: "Chart",
                      props: {
                        title: "Salary by Department",
                        type: "bar",
                        resource: "employees",
                        xField: "department_name",
                        yField: "salary",
                        transform: "avg",
                      },
                    },
                  },
                  {
                    title: "Headcount",
                    component: {
                      type: "Chart",
                      props: {
                        title: "Employee Distribution",
                        type: "pie",
                        resource: "employees",
                        xField: "department_name",
                        yField: "id",
                        transform: "count",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: "departments",
      title: "Departments",
      path: "/departments",
      icon: "bar-chart",
      showInSidebar: true,
      sidebarOrder: 3,
      layoutType: "default",
      zones: [
        {
          name: "main",
          components: [
            {
              type: "DataTable",
              props: {
                resource: "departments",
                columns: [
                  {
                    field: "name",
                    label: "Name",
                    type: "text",
                  },
                  {
                    field: "description",
                    label: "Description",
                    type: "text",
                  },
                  {
                    field: "manager_id",
                    label: "Manager",
                    type: "reference",
                    reference: {
                      resource: "employees",
                      displayField: "name",
                    },
                  },
                ],
                pagination: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: true,
              },
            },
          ],
        },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      path: "/settings",
      icon: "user",
      showInSidebar: true,
      sidebarOrder: 4,
      roleAccess: ["Admin"],
      layoutType: "default",
      zones: [
        {
          name: "main",
          components: [
            {
              type: "SimpleForm",
              props: {
                fields: [
                  {
                    name: "company_name",
                    label: "Company Name",
                    type: "text",
                    required: true,
                    defaultValue: "Acme Inc.",
                  },
                  {
                    name: "admin_email",
                    label: "Admin Email",
                    type: "text",
                    required: true,
                    defaultValue: "admin@example.com",
                  },
                  {
                    name: "enable_notifications",
                    label: "Enable Notifications",
                    type: "boolean",
                    defaultValue: true,
                  },
                  {
                    name: "default_department",
                    label: "Default Department",
                    type: "reference",
                    reference: {
                      resource: "departments",
                      displayField: "name",
                    },
                  },
                ],
                resource: "settings",
                submitAction: "update",
                initialValues: {
                  id: "1",
                  company_name: "Acme Inc.",
                  admin_email: "admin@example.com",
                  enable_notifications: true,
                  default_department: "1",
                },
              },
            },
          ],
        },
      ],
    },
  ],
  resources: {
    employees: {
      actions: ["getList", "getOne", "create", "update", "delete"],
      permissions: {
        Admin: ["*"],
        Manager: ["getList", "getOne", "create", "update"],
        Employee: ["getList", "getOne"],
      },
      fields: {
        name: { type: "text", required: true },
        email: { type: "text", required: true },
        department_id: {
          type: "reference",
          reference: {
            resource: "departments",
            displayField: "name",
          },
          required: true,
        },
        department_name: { type: "text" },
        position: { type: "text", required: true },
        salary: { type: "number", required: true },
        hire_date: { type: "date" },
        is_active: { type: "boolean", required: true },
      },
      hooks: {
        onCreate:
          "function(data, user) { const depts = mockData.departments; const dept = depts.find(d => d.id === data.department_id); if (dept) { data.department_name = dept.name; } data.created_by = user.id; return data; }",
      },
      data: [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          department_id: "1",
          department_name: "Engineering",
          position: "Senior Developer",
          salary: 85000,
          hire_date: "2020-01-15",
          is_active: true,
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          department_id: "2",
          department_name: "Marketing",
          position: "Marketing Manager",
          salary: 75000,
          hire_date: "2019-05-10",
          is_active: true,
        },
        {
          id: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          department_id: "3",
          department_name: "HR",
          position: "HR Specialist",
          salary: 65000,
          hire_date: "2021-03-22",
          is_active: true,
        },
        {
          id: "4",
          name: "Alice Brown",
          email: "alice@example.com",
          department_id: "1",
          department_name: "Engineering",
          position: "Junior Developer",
          salary: 60000,
          hire_date: "2022-01-05",
          is_active: true,
        },
        {
          id: "5",
          name: "Charlie Wilson",
          email: "charlie@example.com",
          department_id: "2",
          department_name: "Marketing",
          position: "Content Writer",
          salary: 55000,
          hire_date: "2021-11-15",
          is_active: true,
        },
      ],
    },
    departments: {
      actions: ["getList", "getOne", "create", "update", "delete"],
      permissions: {
        Admin: ["*"],
        Manager: ["getList", "getOne"],
        Employee: ["getList", "getOne"],
      },
      fields: {
        name: { type: "text", required: true },
        description: { type: "text" },
        manager_id: {
          type: "reference",
          reference: {
            resource: "employees",
            displayField: "name",
          },
        },
      },
      data: [
        {
          id: "1",
          name: "Engineering",
          description: "Software development and IT operations",
          manager_id: "1",
        },
        {
          id: "2",
          name: "Marketing",
          description: "Marketing and sales operations",
          manager_id: "2",
        },
        {
          id: "3",
          name: "HR",
          description: "Human resources and recruitment",
          manager_id: "3",
        },
      ],
    },
    settings: {
      actions: ["getOne", "update"],
      permissions: {
        Admin: ["*"],
      },
      fields: {
        company_name: { type: "text", required: true },
        admin_email: { type: "text", required: true },
        enable_notifications: { type: "boolean" },
        default_department: {
          type: "reference",
          reference: {
            resource: "departments",
            displayField: "name",
          },
        },
      },
      data: [
        {
          id: "1",
          company_name: "Acme Inc.",
          admin_email: "admin@example.com",
          enable_notifications: true,
          default_department: "1",
        },
      ],
    },
  },
  functions: {
    calculateBonus: "function(salary) { return salary * 0.1; }",
  },
  settings: {
    enableAuth: true,
    enableLogging: true,
    persistenceMode: "memory",
  },
}

const sampleConfig = {
  "app": {
    "name": "PerformancePortal",
    "description": "A centralized platform to streamline employee performance reviews and goal management.",
    "version": "1.0",
    "createdBy": "system"
  },
  "auth": {
    "roles": [
      "Administrator",
      "Manager",
      "Employee"
    ],
    "users": [
      {
        "id": "1",
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "password": "Password123",
        "role": "Administrator"
      },
      {
        "id": "2",
        "name": "Bob Smith",
        "email": "bob.smith@example.com",
        "password": "Password123",
        "role": "Manager"
      },
      {
        "id": "3",
        "name": "Carol Lee",
        "email": "carol.lee@example.com",
        "password": "Password123",
        "role": "Employee"
      }
    ]
  },
  "useCases": [
    {
      "id": "employeeEvaluations",
      "useCaseName": "Employee Evaluations",
      "goal": "Facilitate and record periodic employee performance reviews to support development and HR decision-making",
      "actors": [
        "Administrator",
        "Manager",
        "Employee"
      ],
      "preConditions": [
        "Employee profile exists in the system",
        "Scheduled review period is active",
        "Manager has access rights"
      ],
      "triggers": [
        "Scheduled review date arrives",
        "Manager initiates a review",
        "Employee or Administrator requests a review"
      ],
      "flow": [
        "System notifies the Manager of upcoming evaluation",
        "Manager prepares evaluation form",
        "Manager conducts the review with the Employee",
        "Manager records feedback, ratings, and comments in the system",
        "System saves the evaluation details",
        "Employees are notified of completed evaluations for review"
      ],
      "alternativeFlowsAndExceptionHandling": [
        {
          "description": "Manager cancels or postpones the evaluation",
          "steps": [
            "Manager reschedules the review date",
            "System updates the schedule and notifies relevant parties"
          ]
        },
        {
          "description": "Employee is unavailable or misses review",
          "steps": [
            "System flags review as pending",
            "Manager arranges alternative review session",
            "Evaluation is completed upon rescheduled date"
          ]
        },
        {
          "description": "Data entry error or system failure during recording",
          "steps": [
            "Manager is prompted to retry data entry",
            "System logs error and alerts system administrator"
          ]
        }
      ],
      "businessRulesAndConstraints": [
        "Reviews must be conducted and recorded within the scheduled review period",
        "Only authorized roles (Manager, Administrator) can create or modify evaluations",
        "Employees can view their completed evaluations but cannot modify them"
      ],
      "securityAndAuthentication": "Role-based access control; only authenticated users with the appropriate roles can initiate or record evaluations",
      "postConditions": [
        "Evaluation data is stored securely in the system",
        "Employees have access to their performance review records",
        "Management has records for performance tracking and analytics"
      ],
      "successAndAcceptanceCriteria": [
        "All scheduled evaluations are completed and recorded within the defined period",
        "Evaluations are accurate, complete, and properly stored",
        "Relevant stakeholders receive notifications of completion"
      ]
    },
    {
      "id": "goalSettingTracking",
      "useCaseName": "Goal Setting and Tracking",
      "goal": "Enable employees and managers to set, update, and monitor individual and team performance goals effectively",
      "actors": [
        "Employee",
        "Manager",
        "Administrator"
      ],
      "preConditions": [
        "User must be authenticated with appropriate role (Employee, Manager, Administrator)",
        "User must have access to the goal management module"
      ],
      "triggers": [
        "User navigates to the Goals section",
        "User initiates creating or updating a goal"
      ],
      "flow": [
        "User logs into the app and navigates to the Goals dashboard",
        "User selects 'Create New Goal' or chooses an existing goal to update",
        "User enters or modifies goal details (title, description, target metrics, deadline)",
        "User saves the goal",
        "System validates input data",
        "System stores or updates the goal in the database",
        "System displays the goal on user's dashboard with current progress",
        "User can track progress and update goal status periodically"
      ],
      "alternativeFlowsAndExceptionHandling": [
        {
          "description": "User attempts to set a goal with missing required fields",
          "steps": [
            "System displays validation error messages",
            "User corrects input and resubmits"
          ]
        },
        {
          "description": "User tries to update a goal they do not have permission to modify",
          "steps": [
            "System denies access",
            "Displays an authorization error message"
          ]
        }
      ],
      "businessRulesAndConstraints": [
        "Goals must have unique titles per user",
        "Goals must have a set deadline within allowed organizational timeframes",
        "Only authorized roles can create, update, or delete goals"
      ],
      "securityAndAuthentication": "Access to goals is restricted based on user role; only users with permission can modify specific goals",
      "postConditions": [
        "Goals are stored in the system with accurate details",
        "User can view and monitor goal progress"
      ],
      "successAndAcceptanceCriteria": [
        "Goals can be successfully created and updated without errors",
        "Goals are correctly displayed on user dashboards",
        "Progress tracking updates are reflected in real-time"
      ]
    },
    {
      "id": "feedbackRecognitionPlatform",
      "useCaseName": "Feedback and Recognition",
      "goal": "Provide a platform for ongoing peer feedback and recognition to foster a positive workplace culture",
      "actors": [
        "Administrator",
        "Manager",
        "Employee"
      ],
      "preConditions": [
        "User is authenticated with appropriate role",
        "User has access to the platform"
      ],
      "triggers": [
        "User logs into the platform",
        "User navigates to feedback or recognition section"
      ],
      "flow": [
        "User selects 'Provide Feedback' or 'Give Recognition' option",
        "User inputs feedback or recognition message",
        "User selects recipient(s)",
        "User submits the feedback or recognition",
        "System saves the entry and notifies recipient(s)"
      ],
      "alternativeFlowsAndExceptionHandling": [
        {
          "description": "Invalid input or missing information",
          "steps": [
            "System displays error message",
            "User is prompted to correct input"
          ]
        },
        {
          "description": "Recipient is inactive or does not exist",
          "steps": [
            "System alerts user of recipient issue",
            "User selects an active recipient or cancels the action"
          ]
        }
      ],
      "businessRulesAndConstraints": [
        "Users can provide feedback and recognition only during active platform sessions",
        "Feedback must adhere to community guidelines",
        "Recognition cannot be anonymous unless specified"
      ],
      "securityAndAuthentication": "Access is restricted based on roles; only authenticated users can submit feedback or recognition",
      "postConditions": [
        "Feedback and recognition entries are stored in the system",
        "Recipients are notified of received feedback or recognition"
      ],
      "successAndAcceptanceCriteria": [
        "All feedback and recognition submissions are successfully saved and notifications sent",
        "Users find the platform easy to navigate and use"
      ]
    }
  ],
  "pages": [
    {
      "id": "dashboard",
      "title": "Dashboard",
      "path": "/dashboard",
      "icon": "layout-dashboard",
      "showInSidebar": true,
      "sidebarOrder": 1,
      "roleAccess": [
        "Administrator",
        "Manager",
        "Employee"
      ],
      "layoutType": "default",
      "zones": [
        {
          "name": "header",
          "components": [
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Users",
                "resource": "users",
                "field": "user_id",
                "aggregate": "count",
                "filter": null,
                "icon": "users",
                "color": "blue"
              }
            },
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Employees",
                "resource": "employees",
                "field": "employee_id",
                "aggregate": "count",
                "filter": null,
                "icon": "user-check",
                "color": "green"
              }
            },
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Evaluations",
                "resource": "evaluations",
                "field": "evaluation_id",
                "aggregate": "count",
                "filter": null,
                "icon": "clipboard-list",
                "color": "yellow"
              }
            }
          ]
        },
        {
          "name": "charts",
          "components": [
            {
              "type": "Chart",
              "props": {
                "title": "Evaluations Over Time",
                "chartType": "line",
                "resource": "evaluations",
                "xField": "date",
                "yField": "evaluation_id",
                "transform": "count",
                "groupBy": null,
                "filter": null,
                "xFieldReference": null,
                "yFieldReference": null
              }
            },
            {
              "type": "Chart",
              "props": {
                "title": "User Roles Distribution",
                "chartType": "pie",
                "resource": "users",
                "xField": "role",
                "yField": "user_id",
                "transform": "count",
                "groupBy": null,
                "filter": null,
                "xFieldReference": null,
                "yFieldReference": null
              }
            }
          ]
        },
        {
          "name": "latestActivities",
          "components": [
            {
              "type": "DataTable",
              "props": {
                "resource": "feedback_recognition",
                "columns": [
                  {
                    "field": "sender_id",
                    "label": "Sender",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "sender_id"
                    }
                  },
                  {
                    "field": "recipient_id",
                    "label": "Recipient",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "recipient_id"
                    }
                  },
                  {
                    "field": "message",
                    "label": "Message",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "date",
                    "label": "Date",
                    "type": "date",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "type",
                    "label": "Type",
                    "type": "text",
                    "options": null,
                    "reference": null
                  }
                ],
                "filters": null,
                "pagination": true,
                "allowCreate": false,
                "allowEdit": false,
                "allowDelete": false,
                "formValidationRules": null
              }
            }
          ]
        },
        {
          "name": "actions",
          "components": [
            {
              "type": "SimpleForm",
              "props": {
                "resource": "goals",
                "submitAction": "create",
                "fields": [
                  {
                    "name": "title",
                    "label": "Goal Title",
                    "type": "text",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "description",
                    "label": "Description",
                    "type": "text",
                    "required": false,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "creator_id",
                    "label": "Creator",
                    "type": "reference",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  },
                  {
                    "name": "target_metrics",
                    "label": "Target Metrics",
                    "type": "text",
                    "required": false,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "deadline",
                    "label": "Deadline",
                    "type": "date",
                    "required": false,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  }
                ],
                "redirectPath": "/goals"
              }
            }
          ]
        }
      ]
    },
    {
      "id": "employee_evaluations",
      "title": "Employee Evaluations",
      "path": "/evaluations",
      "icon": "file-text",
      "showInSidebar": true,
      "sidebarOrder": 2,
      "roleAccess": [
        "Administrator",
        "Manager"
      ],
      "layoutType": "tabs",
      "zones": [
        {
          "name": "overview",
          "components": [
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Evaluations",
                "resource": "evaluations",
                "field": "evaluation_id",
                "aggregate": "count",
                "filter": null,
                "icon": "clipboard-check",
                "color": "green"
              }
            },
            {
              "type": "MetricCard",
              "props": {
                "title": "Upcoming Evaluations",
                "resource": "evaluations",
                "field": "evaluation_id",
                "aggregate": "count",
                "filter": {
                  "date": "next 30 days"
                },
                "icon": "calendar",
                "color": "blue"
              }
            }
          ]
        },
        {
          "name": "evaluations_list",
          "components": [
            {
              "type": "DataTable",
              "props": {
                "resource": "evaluations",
                "columns": [
                  {
                    "field": "evaluation_id",
                    "label": "Evaluation ID",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "employee_id",
                    "label": "Employee",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "employees",
                      "displayField": "employee_id",
                      "valueField": "employee_id"
                    }
                  },
                  {
                    "field": "manager_id",
                    "label": "Manager",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "employees",
                      "displayField": "employee_id",
                      "valueField": "employee_id"
                    }
                  },
                  {
                    "field": "date",
                    "label": "Evaluation Date",
                    "type": "date",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "feedback",
                    "label": "Feedback",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "ratings",
                    "label": "Ratings",
                    "type": "number",
                    "options": null,
                    "reference": null
                  }
                ],
                "filters": [
                  {
                    "field": "date",
                    "label": "Evaluation Date",
                    "type": "date",
                    "options": null
                  }
                ],
                "pagination": true,
                "allowCreate": false,
                "allowEdit": false,
                "allowDelete": false,
                "formValidationRules": null
              }
            }
          ]
        },
        {
          "name": "actions",
          "components": [
            {
              "type": "SimpleForm",
              "props": {
                "resource": "evaluations",
                "submitAction": "create",
                "fields": [
                  {
                    "name": "employee_id",
                    "label": "Employee",
                    "type": "reference",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": {
                      "resource": "employees",
                      "displayField": "employee_id",
                      "valueField": "employee_id"
                    }
                  },
                  {
                    "name": "manager_id",
                    "label": "Manager",
                    "type": "reference",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": {
                      "resource": "employees",
                      "displayField": "employee_id",
                      "valueField": "employee_id"
                    }
                  },
                  {
                    "name": "date",
                    "label": "Evaluation Date",
                    "type": "date",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "feedback",
                    "label": "Feedback",
                    "type": "text",
                    "required": false,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "ratings",
                    "label": "Ratings",
                    "type": "number",
                    "required": false,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  }
                ],
                "redirectPath": null
              }
            }
          ]
        }
      ]
    },
    {
      "id": "goal_setting_tracking",
      "title": "Goal Setting and Tracking",
      "path": "/goals",
      "icon": "pie-chart",
      "showInSidebar": true,
      "sidebarOrder": 3,
      "roleAccess": [
        "Administrator",
        "Manager",
        "Employee"
      ],
      "layoutType": "grid",
      "zones": [
        {
          "name": "header",
          "components": [
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Goals",
                "resource": "goals",
                "field": "goal_id",
                "aggregate": "count",
                "filter": null,
                "icon": "target",
                "color": "blue"
              }
            },
            {
              "type": "MetricCard",
              "props": {
                "title": "Active Goals",
                "resource": "goals",
                "field": "goal_id",
                "aggregate": "count",
                "filter": {
                  "field": "status",
                  "operator": "=",
                  "value": "Active"
                },
                "icon": "check-circle",
                "color": "green"
              }
            }
          ]
        },
        {
          "name": "main",
          "components": [
            {
              "type": "DataTable",
              "props": {
                "resource": "goals",
                "columns": [
                  {
                    "field": "title",
                    "label": "Title",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "creator_id",
                    "label": "Creator",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  },
                  {
                    "field": "description",
                    "label": "Description",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "target_metrics",
                    "label": "Target Metrics",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "deadline",
                    "label": "Deadline",
                    "type": "date",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "current_progress",
                    "label": "Progress",
                    "type": "number",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "status",
                    "label": "Status",
                    "type": "text",
                    "options": null,
                    "reference": null
                  }
                ],
                "filters": [
                  {
                    "field": "status",
                    "label": "Status",
                    "type": "select",
                    "options": [
                      "Active",
                      "Completed",
                      "Pending"
                    ]
                  }
                ],
                "pagination": true,
                "allowCreate": true,
                "allowEdit": true,
                "allowDelete": true,
                "formValidationRules": null
              }
            }
          ]
        }
      ]
    },
    {
      "id": "feedback_recognition",
      "title": "Feedback and Recognition",
      "path": "/feedback-recognition",
      "icon": "activity",
      "showInSidebar": true,
      "sidebarOrder": 4,
      "roleAccess": [
        "Administrator",
        "Manager",
        "Employee"
      ],
      "layoutType": "default",
      "zones": [
        {
          "name": "header",
          "components": [
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Feedback Entries",
                "resource": "feedback_recognition",
                "field": "entry_id",
                "aggregate": "count",
                "filter": null,
                "icon": "star",
                "color": "purple"
              }
            },
            {
              "type": "MetricCard",
              "props": {
                "title": "Total Users",
                "resource": "users",
                "field": "user_id",
                "aggregate": "count",
                "filter": null,
                "icon": "users",
                "color": "blue"
              }
            }
          ]
        },
        {
          "name": "mainContent",
          "components": [
            {
              "type": "DataTable",
              "props": {
                "resource": "feedback_recognition",
                "columns": [
                  {
                    "field": "message",
                    "label": "Message",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "date",
                    "label": "Date",
                    "type": "date",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "type",
                    "label": "Type",
                    "type": "text",
                    "options": null,
                    "reference": null
                  },
                  {
                    "field": "sender_id",
                    "label": "Sender",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  },
                  {
                    "field": "recipient_id",
                    "label": "Recipient",
                    "type": "reference",
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  }
                ],
                "filters": [],
                "pagination": true,
                "allowCreate": false,
                "allowEdit": false,
                "allowDelete": false,
                "formValidationRules": null
              }
            },
            {
              "type": "SimpleForm",
              "props": {
                "resource": "feedback_recognition",
                "submitAction": "create",
                "fields": [
                  {
                    "name": "sender_id",
                    "label": "Sender",
                    "type": "reference",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  },
                  {
                    "name": "recipient_id",
                    "label": "Recipient",
                    "type": "reference",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": {
                      "resource": "users",
                      "displayField": "name",
                      "valueField": "user_id"
                    }
                  },
                  {
                    "name": "message",
                    "label": "Message",
                    "type": "text",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "date",
                    "label": "Date",
                    "type": "date",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  },
                  {
                    "name": "type",
                    "label": "Type",
                    "type": "text",
                    "required": true,
                    "defaultValue": null,
                    "options": null,
                    "reference": null
                  }
                ],
                "redirectPath": null
              }
            }
          ]
        }
      ]
    }
  ],
  "resources": {
    "users": {
      "fields": {
        "user_id": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "name": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "email": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "role": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        }
      },
      "actions": [
        "getList",
        "getOne",
        "create",
        "update",
        "delete"
      ],
      "permissions": {
        "Administrator": [
          "getList",
          "getOne",
          "create",
          "update",
          "delete"
        ],
        "Manager": [
          "getList",
          "getOne",
          "update"
        ],
        "Employee": [
          "getOne"
        ]
      },
      "data": [
        {
          "user_id": "u001",
          "name": "Alice Johnson",
          "email": "alice.johnson@example.com",
          "role": "Employee"
        },
        {
          "user_id": "u002",
          "name": "Bob Smith",
          "email": "bob.smith@example.com",
          "role": "Manager"
        },
        {
          "user_id": "u003",
          "name": "Carol Williams",
          "email": "carol.williams@example.com",
          "role": "Administrator"
        }
      ]
    },
    "employees": {
      "fields": {
        "employee_id": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "user_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "users",
            "displayField": "name"
          }
        },
        "department": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        }
      },
      "actions": [
        "getList",
        "getOne",
        "create",
        "update",
        "delete"
      ],
      "permissions": {
        "Administrator": [
          "getList",
          "getOne",
          "create",
          "update",
          "delete"
        ],
        "Manager": [
          "getList",
          "getOne",
          "create",
          "update"
        ],
        "Employee": [
          "getList",
          "getOne",
          "update"
        ]
      },
      "data": [
        {
          "employee_id": "E001",
          "user_id": "u001",
          "department": "Finance"
        },
        {
          "employee_id": "E002",
          "user_id": "u002",
          "department": "Sales"
        },
        {
          "employee_id": "E003",
          "user_id": "u003",
          "department": "HR"
        }
      ]
    },
    "evaluations": {
      "fields": {
        "evaluation_id": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "employee_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "employees",
            "displayField": "employee_id"
          }
        },
        "manager_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "employees",
            "displayField": "employee_id"
          }
        },
        "date": {
          "type": "date",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "feedback": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "ratings": {
          "type": "number",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "comments": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        }
      },
      "actions": [
        "getList",
        "getOne",
        "create",
        "update",
        "delete"
      ],
      "permissions": {
        "Administrator": [
          "*"
        ],
        "Manager": [
          "getList",
          "getOne",
          "create",
          "update",
          "delete"
        ],
        "Employee": [
          "getList",
          "getOne",
          "create",
          "update"
        ]
      },
      "data": [
        {
          "evaluation_id": "eval001",
          "employee_id": "E001",
          "manager_id": "E002",
          "date": "2023-08-15",
          "feedback": "Great teamwork and communication.",
          "ratings": 4,
          "comments": "Keep up the good work."
        },
        {
          "evaluation_id": "eval002",
          "employee_id": "E002",
          "manager_id": "E003",
          "date": "2023-08-10",
          "feedback": "Needs improvement in meeting deadlines.",
          "ratings": 3,
          "comments": "Focus on time management."
        }
      ]
    },
    "goals": {
      "fields": {
        "goal_id": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "creator_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "users",
            "displayField": "name"
          }
        },
        "title": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "description": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "target_metrics": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "deadline": {
          "type": "date",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "current_progress": {
          "type": "number",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "status": {
          "type": "text",
          "required": false,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        }
      },
      "actions": [
        "getList",
        "getOne",
        "create",
        "update",
        "delete"
      ],
      "permissions": {
        "Administrator": [
          "getList",
          "getOne",
          "create",
          "update",
          "delete"
        ],
        "Manager": [
          "getList",
          "getOne",
          "create",
          "update"
        ],
        "Employee": [
          "getList",
          "getOne",
          "create",
          "update"
        ]
      },
      "data": [
        {
          "goal_id": "g001",
          "creator_id": "u001",
          "title": "Improve Monthly Sales",
          "description": "Aim to increase monthly sales by 15% over the next quarter.",
          "target_metrics": "Monthly sales growth",
          "deadline": "2023-12-31",
          "current_progress": 10,
          "status": "In Progress"
        },
        {
          "goal_id": "g002",
          "creator_id": "u002",
          "title": "Enhance Customer Satisfaction",
          "description": "Implement a new customer feedback system to improve satisfaction scores.",
          "target_metrics": "Customer satisfaction score",
          "deadline": "2024-03-31",
          "current_progress": 75,
          "status": "In Progress"
        },
        {
          "goal_id": "g003",
          "creator_id": "u003",
          "title": "Develop Leadership Program",
          "description": "Create a leadership development program for high-potential employees.",
          "target_metrics": "Leadership skills enhancement",
          "deadline": "2024-06-30",
          "current_progress": 20,
          "status": "Not Started"
        }
      ]
    },
    "feedback_recognition": {
      "fields": {
        "entry_id": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "sender_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "users",
            "displayField": "name"
          }
        },
        "recipient_id": {
          "type": "reference",
          "required": true,
          "reference": {
            "resource": "users",
            "displayField": "name"
          }
        },
        "message": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "date": {
          "type": "date",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        },
        "type": {
          "type": "text",
          "required": true,
          "reference": {
            "resource": "",
            "displayField": ""
          }
        }
      },
      "actions": [
        "getList",
        "getOne",
        "create",
        "update",
        "delete"
      ],
      "permissions": {
        "Administrator": [
          "getList",
          "getOne",
          "create",
          "update",
          "delete"
        ],
        "Manager": [
          "getList",
          "getOne",
          "create",
          "update"
        ],
        "Employee": [
          "getList",
          "getOne",
          "create"
        ]
      },
      "data": [
        {
          "entry_id": "FEEDBACK001",
          "sender_id": "u002",
          "recipient_id": "u001",
          "message": "Great teamwork during the recent project.",
          "date": "2023-09-01",
          "type": "Recognition"
        },
        {
          "entry_id": "FEEDBACK002",
          "sender_id": "u001",
          "recipient_id": "u002",
          "message": "Thank you for your support in the sales campaign.",
          "date": "2023-09-02",
          "type": "Recognition"
        },
        {
          "entry_id": "FEEDBACK003",
          "sender_id": "u003",
          "recipient_id": "u001",
          "message": "Appreciate your leadership in the HR initiatives.",
          "date": "2023-09-03",
          "type": "Recognition"
        }
      ]
    }
  },
  "settings": {
    "enableAuth": true,
    "enableLogging": true,
    "persistenceMode": "memory"
  }
}

export default sampleConfig
