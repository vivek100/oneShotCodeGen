import type { AppConfig } from "../types/config"

// Store for our mock data
let mockData: Record<string, any[]> = {}
let initialized = false

export function initMockApi(config: any) {
  console.log("Initializing mock API with config:", config.resources)
  if (initialized) return

  // Initialize the mock data store with the seed data from the config
  mockData = {}

  // Initialize each resource with its seed data
  Object.entries(config.resources).forEach(([resourceName, resource]) => {
    mockData[resourceName] = [...(resource.data || [])]
  })
  console.log("Mock API initialized with all data:", config.resources, mockData)
  initialized = true

  console.log("Mock API initialized with resources:", Object.keys(mockData))
}

// Generic CRUD operations
export const mockApi = {
  // Get a list of resources with optional filtering
  getList: async (resource: string, params: any = {}) => {
    const { filter = {}, sort, pagination = { page: 1, perPage: 10 } } = params

    // Check if the resource exists
    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }
    // Don't apply filters if value is null
    if (filter === null) {
      return { data: mockData[resource] }
    }
    // Apply filters
    const filteredData = mockData[resource].filter((item) => {
      return Object.entries(filter).every(([key, value]) => {
        return item[key] === value
      })
    })

    // Apply sorting
    if (sort && sort.field) {
      const { field, order } = sort
      filteredData.sort((a, b) => {
        if (a[field] < b[field]) return order === "asc" ? -1 : 1
        if (a[field] > b[field]) return order === "asc" ? 1 : -1
        return 0
      })
    }

    // Apply pagination
    const { page, perPage } = pagination
    const start = (page - 1) * perPage
    const end = start + perPage
    const paginatedData = filteredData.slice(start, end)

    return {
      data: paginatedData,
      total: filteredData.length,
    }
  },

  // Get a single resource by ID
  getOne: async (resource: string, id: string) => {
    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }

    const item = mockData[resource].find((item) => item.id === id)

    if (!item) {
      throw new Error(`Item with ID "${id}" not found in resource "${resource}"`)
    }

    return { data: item }
  },

  // Create a new resource
  create: async (resource: string, data: any) => {
    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }

    // Generate a unique ID if not provided
    const newItem = {
      id: data.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    }

    mockData[resource].push(newItem)

    return { data: newItem }
  },

  // Update an existing resource
  update: async (resource: string, id: string, data: any) => {
    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }

    const index = mockData[resource].findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Item with ID "${id}" not found in resource "${resource}"`)
    }

    // Merge the existing item with the new data
    const updatedItem = {
      ...mockData[resource][index],
      ...data,
      id, // Ensure ID doesn't change
    }

    mockData[resource][index] = updatedItem

    return { data: updatedItem }
  },

  // Delete a resource
  delete: async (resource: string, id: string) => {
    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }

    const index = mockData[resource].findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Item with ID "${id}" not found in resource "${resource}"`)
    }

    const deletedItem = mockData[resource][index]
    mockData[resource].splice(index, 1)

    return { data: deletedItem }
  },

  // Aggregate data for metrics and charts
  aggregate: async (resource: string, params: any) => {
    const { field, aggregate, filter = {} } = params

    if (!mockData[resource]) {
      throw new Error(`Resource "${resource}" not found`)
    }
    // Don't apply filters if value is null
    if (filter === null) {
      return { result: mockData[resource].length }
    }
    // Apply filters
    const filteredData = mockData[resource].filter((item) => {
      return Object.entries(filter).every(([key, value]) => {
        return item[key] === value
      })
    })

    // Apply aggregation
    let result: number

    switch (aggregate) {
      case "count":
        result = filteredData.length
        break
      case "sum":
        result = filteredData.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
        break
      case "avg":
        result = filteredData.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / (filteredData.length || 1)
        break
      case "min":
        result = Math.min(...filteredData.map((item) => Number(item[field]) || 0))
        break
      case "max":
        result = Math.max(...filteredData.map((item) => Number(item[field]) || 0))
        break
      default:
        throw new Error(`Unsupported aggregate function: ${aggregate}`)
    }

    return { result }
  },
}
