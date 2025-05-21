// src/api/mock-data.ts

export const mockProjects = [
  {
    id: "p1",
    name: "My Internal Tool",
    createdAt: "2024-04-24",
    description: "A modular internal tool app driven by configuration",
    status: "active",
    teamSize: 3,
    lastUpdated: "2024-04-26",
  },
  {
    id: "p2",
    name: "HR Management System",
    createdAt: "2024-04-22",
    description: "Employee management and HR processes",
    status: "active",
    teamSize: 5,
    lastUpdated: "2024-04-25",
  },
  {
    id: "p3",
    name: "Inventory Tracker",
    createdAt: "2024-04-20",
    description: "Track inventory and manage stock levels",
    status: "draft",
    teamSize: 2,
    lastUpdated: "2024-04-23",
  },
]

export const mockMessages = [
  { id: "1", role: "user", content: "Create an app to manage employees" },
  { id: "2", role: "assistant", content: "App generation started..." },
  { id: "3", role: "system", content: "Use case generation step completed" },
  {
    id: "4",
    role: "assistant",
    content:
      "I've created the basic structure for your employee management app. It includes employee and department resources with appropriate fields and permissions.",
  },
  { id: "5", role: "user", content: "Can you add a dashboard with metrics?" },
  { id: "6", role: "assistant", content: "I'll add a dashboard with employee and department metrics." },
  { id: "7", role: "system", content: "Dashboard generation step completed" },
  {
    id: "8",
    role: "assistant",
    content:
      "I've added a dashboard with metrics showing total employees and departments. Would you like to add any other metrics or features?",
  },
]

export const mockAppConfig = {
  app: {
    id: "app1",
    name: "My Internal Tool",
    description: "A modular internal tool app driven by configuration",
    version: "1.0.0",
    createdBy: "user",
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
      icon: "layout-dashboard",
      showInSidebar: true,
      sidebarOrder: 1,
      roleAccess: ["Admin", "Manager", "Employee"],
      layoutType: "default",
      zones: [
        {
          name: "metrics",
          components: [
            {
              type: "MetricCard",
              props: {
                title: "Total Employees",
                valueSource: {
                  type: "api",
                  resource: "employees",
                  field: "id",
                  aggregate: "count",
                },
                icon: "users",
                color: "blue",
              },
            },
            {
              type: "MetricCard",
              props: {
                title: "Total Departments",
                valueSource: {
                  type: "api",
                  resource: "departments",
                  field: "id",
                  aggregate: "count",
                },
                icon: "bar-chart",
                color: "green",
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
                  { field: "name", label: "Name", type: "text" },
                  { field: "email", label: "Email", type: "text" },
                  {
                    field: "department_id",
                    label: "Department",
                    type: "reference",
                    reference: {
                      resource: "departments",
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
  ],
  resources: {
    employees: {
      actions: ["getList", "getOne", "create", "update", "delete"],
      permissions: {
        Admin: ["*"],
        Manager: ["getList", "getOne", "update"],
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
        },
      },
      data: [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          department_id: "1",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          department_id: "2",
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
      },
      data: [
        { id: "1", name: "Engineering" },
        { id: "2", name: "Marketing" },
        { id: "3", name: "Human Resources" },
      ],
    },
  },
  settings: {
    enableAuth: true,
    enableLogging: true,
    persistenceMode: "memory",
  },
}

export const mockResources = mockAppConfig.resources

export const mockFlows = [
  {
    id: "flow1",
    name: "create_app_full",
    version: 1,
    description: "Creates a complete app from scratch",
    is_active: true,
    start_message: "Starting app generation...",
    complete_message: "App successfully generated!",
  },
  {
    id: "flow2",
    name: "edit_partial_flow",
    version: 1,
    description: "Edits specific parts of an existing app",
    is_active: true,
    start_message: "Starting app editing...",
    complete_message: "App successfully updated!",
  },
  {
    id: "flow3",
    name: "schema_update_flow",
    version: 1,
    description: "Update data schema only",
    is_active: false,
    start_message: "Starting schema update...",
    complete_message: "Schema successfully updated!",
  },
]

export const mockSteps = [
  {
    id: "s1",
    flow_id: "flow1",
    name: "analyze_requirements",
    step_type: "ai_single",
    order: 0,
    input_map: {
      project_description: "input_data.description",
      requirements: "input_data.requirements",
    },
    system_message: "You are an AI assistant that analyzes requirements for applications.",
    prompt_template:
      "// This would be the actual prompt template in production\n// Example:\n\nYou are analyzing the following requirements:\n\n{{ user_message }}\n\nExtract the key features mentioned in these requirements and return them as a JSON array.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          features: {
            type: "array",
            items: { type: "string" },
          },
          entities: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            requirements: "Build a CRM system with contact management and email tracking",
          },
          output: {
            features: ["Contact Management", "Email Tracking", "Dashboard"],
            entities: ["Contact", "Email", "User"],
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Analyzing requirements...",
    complete_message: "Finished analyzing requirements.",
  },
  {
    id: "s2",
    flow_id: "flow1",
    name: "create_use_cases",
    step_type: "ai_loop",
    order: 1,
    input_map: {
      features: "previous_step.features",
      entities: "previous_step.entities",
    },
    system_message: "You are an AI assistant that generates use cases based on features and entities.",
    prompt_template:
      "Based on the following features and entities, generate detailed use cases:\n\nFeatures: {{features}}\n\nEntities: {{entities}}\n\nFor each feature, create a use case with actors, flow steps, and pre-conditions.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          use_cases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                use_case_name: { type: "string" },
                goal: { type: "string" },
                actors: { type: "array", items: { type: "string" } },
                flow: { type: "array", items: { type: "string" } },
                pre_conditions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            features: ["User Management", "Task Assignment"],
            entities: ["User", "Task", "Project"],
          },
          output: {
            use_cases: [
              {
                use_case_name: "User Registration",
                goal: "Allow new users to register in the system",
                actors: ["Anonymous User", "System"],
                flow: [
                  "User navigates to registration page",
                  "User fills in required information",
                  "System validates the information",
                  "System creates new user account",
                  "System sends confirmation email",
                ],
                pre_conditions: ["Registration is enabled"],
              },
              {
                use_case_name: "Task Assignment",
                goal: "Allow managers to assign tasks to users",
                actors: ["Manager", "User", "System"],
                flow: [
                  "Manager selects a project",
                  "Manager creates a new task",
                  "Manager assigns task to a user",
                  "System notifies the user",
                  "User acknowledges the task",
                ],
                pre_conditions: ["Manager is logged in", "User exists in the system"],
              },
            ],
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Generating use cases...",
    complete_message: "Finished generating use cases.",
  },
  {
    id: "s3",
    flow_id: "flow1",
    name: "define_resources",
    step_type: "ai_single",
    order: 2,
    input_map: {
      use_cases: "previous_step.use_cases",
    },
    system_message: "You are an AI assistant that defines resource schemas based on use cases.",
    prompt_template:
      "Based on the following use cases, define the resources (database tables) needed:\n\n{{use_cases}}\n\nFor each resource, define fields, relationships, and validation rules.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          resources: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                fields: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      required: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            use_cases: [
              {
                use_case_name: "User Management",
                goal: "Manage user accounts",
                entities: ["User", "Role"],
              },
            ],
          },
          output: {
            resources: {
              users: {
                fields: {
                  name: { type: "text", required: true },
                  email: { type: "text", required: true },
                  role_id: {
                    type: "reference",
                    reference: { resource: "roles", displayField: "name" },
                    required: true,
                  },
                },
              },
              roles: {
                fields: {
                  name: { type: "text", required: true },
                  permissions: { type: "json", required: false },
                },
              },
            },
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Defining resources...",
    complete_message: "Finished defining resources.",
  },
  {
    id: "s4",
    flow_id: "flow1",
    name: "create_pages",
    step_type: "ai_single",
    order: 3,
    input_map: {
      resources: "previous_step.resources",
      use_cases: "flow_state.use_cases",
    },
    system_message: "You are an AI assistant that generates UI pages based on resources and use cases.",
    prompt_template:
      "Based on the following resources and use cases, generate UI pages:\n\nResources: {{resources}}\n\nUse Cases: {{use_cases}}\n\nFor each main entity, create CRUD pages and any special views needed.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                path: { type: "string" },
                components: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            resources: {
              products: {
                fields: {
                  name: { type: "text", required: true },
                  price: { type: "number", required: true },
                },
              },
            },
            use_cases: [
              {
                use_case_name: "Product Management",
                goal: "Manage product catalog",
              },
            ],
          },
          output: {
            pages: [
              {
                id: "product_list",
                title: "Products",
                path: "/products",
                components: [
                  {
                    type: "DataTable",
                    props: {
                      resource: "products",
                      columns: [
                        { field: "name", label: "Name" },
                        { field: "price", label: "Price" },
                      ],
                    },
                  },
                ],
              },
              {
                id: "product_detail",
                title: "Product Details",
                path: "/products/:id",
                components: [
                  {
                    type: "DetailView",
                    props: {
                      resource: "products",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Generating UI pages...",
    complete_message: "Finished generating UI pages.",
  },
  {
    id: "s5",
    flow_id: "flow1",
    name: "finalize_app",
    step_type: "ai_single",
    order: 4,
    input_map: {
      resources: "flow_state.resources",
      pages: "previous_step.pages",
      use_cases: "flow_state.use_cases",
    },
    system_message: "You are an AI assistant that finalizes app configurations.",
    prompt_template:
      "Finalize the app configuration by combining all components:\n\nResources: {{resources}}\n\nPages: {{pages}}\n\nUse Cases: {{use_cases}}\n\nCreate a complete app configuration with all necessary settings.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          app: {
            type: "object",
            properties: {
              name: { type: "string" },
              version: { type: "string" },
              description: { type: "string" },
            },
          },
          resources: { type: "object" },
          pages: { type: "array" },
          settings: { type: "object" },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            resources: {
              users: {
                fields: {
                  name: { type: "text", required: true },
                },
              },
            },
            pages: [
              {
                id: "dashboard",
                title: "Dashboard",
                path: "/dashboard",
              },
            ],
            use_cases: [
              {
                use_case_name: "User Management",
              },
            ],
          },
          output: {
            app: {
              name: "User Management System",
              version: "1.0.0",
              description: "A system to manage users",
            },
            resources: {
              users: {
                fields: {
                  name: { type: "text", required: true },
                },
              },
            },
            pages: [
              {
                id: "dashboard",
                title: "Dashboard",
                path: "/dashboard",
              },
            ],
            settings: {
              enableAuth: true,
              theme: "light",
            },
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Finalizing app configuration...",
    complete_message: "App configuration finalized.",
  },
  {
    id: "s6",
    flow_id: "flow2",
    name: "update_resources",
    step_type: "ai_single",
    order: 0,
    input_map: {
      current_resources: "input_data.resources",
      changes: "input_data.changes",
    },
    system_message: "You are an AI assistant that updates resource schemas based on requested changes.",
    prompt_template:
      "Update the following resources based on the requested changes:\n\nCurrent Resources: {{current_resources}}\n\nRequested Changes: {{changes}}\n\nModify the resources while preserving existing data and relationships.",
    output_schema: JSON.stringify(
      {
        type: "object",
        properties: {
          updated_resources: { type: "object" },
        },
      },
      null,
      2,
    ),
    oneshot_examples: JSON.stringify(
      [
        {
          input: {
            current_resources: {
              users: {
                fields: {
                  name: { type: "text", required: true },
                },
              },
            },
            changes: "Add email field to users",
          },
          output: {
            updated_resources: {
              users: {
                fields: {
                  name: { type: "text", required: true },
                  email: { type: "text", required: true },
                },
              },
            },
          },
        },
      ],
      null,
      2,
    ),
    start_message: "Updating resources...",
    complete_message: "Resources updated.",
  },
]

export const mockVersions = [
  {
    id: "v3",
    version_number: 3,
    created_at: "2024-04-24T10:00:00Z",
    created_by: "John Doe",
    is_current: true,
    description: "Added dashboard metrics and employee filters",
    config_json: {
      app: {
        name: "My Internal Tool",
        version: "1.0.2",
        description: "A modular internal tool app driven by configuration",
      },
      resources: {
        employees: {
          fields: {
            name: { type: "text", required: true },
            email: { type: "text", required: true },
            department_id: { type: "reference", required: true },
          },
        },
        departments: {
          fields: {
            name: { type: "text", required: true },
          },
        },
      },
    },
    changes: [
      {
        type: "add",
        path: "pages.dashboard.zones.metrics",
        description: "Added employee count metric",
      },
      {
        type: "modify",
        path: "resources.employees",
        description: "Added filters to employee table",
      },
    ],
  },
  {
    id: "v2",
    version_number: 2,
    created_at: "2024-04-23T15:30:00Z",
    created_by: "Jane Smith",
    is_current: false,
    description: "Added department management",
    config_json: {
      app: {
        name: "My Internal Tool",
        version: "1.0.1",
        description: "A modular internal tool app driven by configuration",
      },
    },
    changes: [
      {
        type: "add",
        path: "resources.departments",
        description: "Added departments resource",
      },
      {
        type: "modify",
        path: "resources.employees",
        description: "Added department reference to employees",
      },
    ],
  },
  {
    id: "v1",
    version_number: 1,
    created_at: "2024-04-22T09:15:00Z",
    created_by: "System",
    is_current: false,
    description: "Initial version",
    config_json: {
      app: {
        name: "My Internal Tool",
        version: "1.0.0",
        description: "A modular internal tool app driven by configuration",
      },
    },
    changes: [
      {
        type: "add",
        path: "app",
        description: "Initial app configuration",
      },
      {
        type: "add",
        path: "resources.employees",
        description: "Added employees resource",
      },
    ],
  },
]

export const mockFlowRuns = [
  {
    id: "run1",
    flow_id: "flow1",
    flow_name: "create_app_full",
    status: "complete",
    started_at: "2024-04-24T10:00:00Z",
    ended_at: "2024-04-24T10:05:30Z",
    duration: 330,
  },
  {
    id: "run2",
    flow_id: "flow2",
    flow_name: "edit_partial_flow",
    status: "complete",
    started_at: "2024-04-23T15:30:00Z",
    ended_at: "2024-04-23T15:32:45Z",
    duration: 165,
  },
]

export const mockStepRuns = [
  {
    id: "step_run1",
    flow_run_id: "run1",
    step_id: "s1",
    step_name: "analyze_requirements",
    status: "success",
    input_data: {
      project_description: "An internal tool for employee management",
      requirements: ["Employee CRUD", "Department management"],
    },
    output_data: {
      features: ["Employee Management", "Department Management", "User Authentication"],
      entities: ["Employee", "Department", "User"],
    },
    prompt_template:
      "You are analyzing the following requirements:\n\n{{requirements}}\n\nExtract the key features mentioned in these requirements and return them as a JSON array.",
    output_schema: {
      type: "object",
      properties: {
        features: {
          type: "array",
          items: { type: "string" },
        },
        entities: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    started_at: "2024-04-24T10:01:15Z",
    ended_at: "2024-04-24T10:02:30Z",
    duration: 75,
  },
  {
    id: "step_run2",
    flow_run_id: "run1",
    step_id: "s2",
    step_name: "create_use_cases",
    status: "success",
    input_data: {
      features: ["Employee Management", "Department Management", "User Authentication"],
      entities: ["Employee", "Department", "User"],
    },
    output_data: {
      use_cases: [
        {
          use_case_name: "Employee Management",
          goal: "Allow administrators to manage employee records",
          actors: ["Admin", "Manager"],
          flow: [
            "Admin navigates to employee list",
            "Admin can view, add, edit, or delete employees",
            "Changes are saved to the database",
          ],
          pre_conditions: ["User must be logged in", "User must have admin privileges"],
        },
        {
          use_case_name: "Department Management",
          goal: "Allow administrators to manage departments",
          actors: ["Admin"],
          flow: [
            "Admin navigates to department list",
            "Admin can view, add, edit, or delete departments",
            "Changes are saved to the database",
          ],
          pre_conditions: ["User must be logged in", "User must have admin privileges"],
        },
      ],
    },
    prompt_template:
      "Based on the following features and entities, generate detailed use cases:\n\nFeatures: {{features}}\n\nEntities: {{entities}}\n\nFor each feature, create a use case with actors, flow steps, and pre-conditions.",
    output_schema: {
      type: "object",
      properties: {
        use_cases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              use_case_name: { type: "string" },
              goal: { type: "string" },
              actors: { type: "array", items: { type: "string" } },
              flow: { type: "array", items: { type: "string" } },
              pre_conditions: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    started_at: "2024-04-24T10:02:45Z",
    ended_at: "2024-04-24T10:03:30Z",
    duration: 45,
  },
  {
    id: "step_run3",
    flow_run_id: "run2",
    step_id: "s6",
    step_name: "update_resources",
    status: "success",
    input_data: {
      current_resources: {
        employees: {
          fields: {
            name: { type: "text", required: true },
            email: { type: "text", required: true },
          },
        },
      },
      changes: "Add department_id field to employees as a reference to departments",
    },
    output_data: {
      updated_resources: {
        employees: {
          fields: {
            name: { type: "text", required: true },
            email: { type: "text", required: true },
            department_id: {
              type: "reference",
              reference: {
                resource: "departments",
                displayField: "name",
              },
            },
          },
        },
        departments: {
          fields: {
            name: { type: "text", required: true },
          },
        },
      },
    },
    prompt_template:
      "Update the following resources based on the requested changes:\n\nCurrent Resources: {{current_resources}}\n\nRequested Changes: {{changes}}\n\nModify the resources while preserving existing data and relationships.",
    output_schema: {
      type: "object",
      properties: {
        updated_resources: { type: "object" },
      },
    },
    started_at: "2024-04-23T15:30:15Z",
    ended_at: "2024-04-23T15:31:30Z",
    duration: 75,
  },
]
