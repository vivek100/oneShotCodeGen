// Define the types for the app configuration

// App info
export interface AppInfo {
  name: string
  description?: string
  version: string
  createdBy?: string
}

// Auth
export interface AuthUser {
  id: string
  name: string
  email: string
  password: string
  role: string
}

export interface Auth {
  roles: string[]
  users: AuthUser[]
}

// Component types
export type ComponentType = "MetricCard" | "DataTable" | "SimpleForm" | "WizardForm" | "Chart" | "TabsComponent"

// Component props (base interface)
export interface ComponentProps {
  [key: string]: any
}

// Page component
export interface PageComponent {
  type: ComponentType
  props: ComponentProps
}

// Page zone
export interface PageZone {
  name: string
  components: PageComponent[]
}

// Page
export interface Page {
  id: string
  title: string
  path: string
  icon?: string
  showInSidebar: boolean
  sidebarOrder?: number
  roleAccess?: string[]
  layoutType?: "default" | "tabs" | "grid"
  zones: PageZone[]
}

// Resource field
export interface ResourceField {
  type: "text" | "number" | "boolean" | "date" | "select" | "reference"
  required?: boolean
  options?: string[] | { label: string; value: string }[]
  reference?: {
    resource: string
    displayField: string
  }
  pattern?: string
  min?: number
  max?: number
}

// Resource
export interface Resource {
  actions: ("getList" | "getOne" | "create" | "update" | "delete")[]
  permissions: {
    [role: string]: string[]
  }
  fields: {
    [fieldName: string]: ResourceField
  }
  hooks?: {
    onCreate?: string
    onUpdate?: string
    onDelete?: string
  }
  data?: any[]
}

// Settings
export interface Settings {
  enableAuth: boolean
  enableLogging: boolean
  persistenceMode: "memory" | "localStorage" | "file"
}

// Complete app configuration
export interface AppConfig {
  app: AppInfo
  auth: Auth
  pages: Page[]
  resources: {
    [resourceName: string]: Resource
  }
  functions?: {
    [functionName: string]: string
  }
  settings?: Settings
}
