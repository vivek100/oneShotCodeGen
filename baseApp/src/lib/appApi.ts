let API_BASE_URL = "http://localhost:8000"
export async function getAppConfig(projectId: string){

  try {
    const res = await fetch(`${API_BASE_URL}/app-version/latest?project_id=${projectId}`)
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log("No app versions found for this project, returning empty config")
        return {
          app: {
            name: "New App",
            version: "0.1.0",
            description: "",
            createdBy: "user",
          },
          resources: {},
          pages: [],
          auth: { roles: [], users: [] },
        }
      }
      throw new Error(`Error fetching app config: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    if (data.config_json) {
      const configJson = data.config_json
      return {
        ...configJson,
        app: {
          ...configJson.app,
          version: configJson.app?.version || data.app?.versionNumber?.toString() || "1.0.0",
          createdBy: configJson.app?.createdBy || data.app?.createdBy || "user",
        },
      }
    }

    console.warn('Backend returned unexpected app config structure:', data)
    return {
      app: {
        name: "New App",
        version: "0.1.0",
        description: "",
        createdBy: "user",
      },
      resources: {},
      pages: [],
      auth: { roles: [], users: [] },
    }
  } catch (error) {
    console.error("Failed to fetch app config:", error)
    return {
      app: {
        name: "New App",
        version: "0.1.0",
        description: "",
        createdBy: "user",
      },
      resources: {},
      pages: [],
      auth: { roles: [], users: [] }
    }
  }
}
