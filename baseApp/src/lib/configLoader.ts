import type { AppConfig } from "../types/config"
import sampleConfig from "./sampleConfig"

export async function loadConfig(): Promise<AppConfig> {
  try {
    // In a client-only app, we need to use the fetch API
    const response = await fetch("/app.config.json")

    if (!response.ok) {
      console.warn(`Failed to load config from server: ${response.status} ${response.statusText}`)
      console.info("Using sample config instead")
      return sampleConfig
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Response is not JSON, using sample config instead")
      return sampleConfig
    }

    const config = await response.json()

    // Validate the config structure
    validateConfig(config)

    return config
  } catch (error) {
    console.error("Error loading config:", error)
    console.info("Using sample config instead")
    return sampleConfig
  }
}

function validateConfig(config: any): void {
  // Basic validation to ensure the config has the required structure
  if (!config.app) {
    throw new Error('Config missing "app" section')
  }

  if (!config.pages || !Array.isArray(config.pages) || config.pages.length === 0) {
    throw new Error('Config missing "pages" section or pages array is empty')
  }

  if (!config.resources || Object.keys(config.resources).length === 0) {
    throw new Error('Config missing "resources" section or resources object is empty')
  }

  if (!config.auth || !config.auth.roles || !config.auth.users) {
    throw new Error('Config missing "auth" section or auth is incomplete')
  }
}
