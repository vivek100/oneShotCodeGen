const USE_MOCK = false

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

import {
  mockProjects,
  mockMessages,
  mockAppConfig,
  mockFlows,
  mockSteps,
  mockVersions,
  mockFlowRuns,
  mockStepRuns,
  mockResources,
} from "./mock-data"
import { getAuthHeaders } from "../lib/apiUtils"
console.log("api.ts called")

// Utility function to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  return Object.keys(obj).reduce((result: any, key) => {
    // Convert key from snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Convert nested objects/arrays recursively
    result[camelKey] = toCamelCase(obj[key]);
    
    return result;
  }, {});
}

export async function generateCode(projectId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/generate-code`, {
    headers
  });
  return res;  // Return the full response for blob handling
}

export async function getProjects() {
  if (USE_MOCK) return Promise.resolve(mockProjects)
  
  try {
    const res = await fetch(`${API_BASE_URL}/projects`)
    
    // Check if response is ok
    if (!res.ok) {
      console.error(`Failed to fetch projects: ${res.status} ${res.statusText}`)
      return [] // Return empty array on error
    }
    
    const data = await res.json()
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error('Projects data is not an array:', data)
      return [] // Return empty array if data is not an array
    }
    
    // Convert snake_case to camelCase
    const camelCaseData = toCamelCase(data)
    
    // Map backend fields to frontend expected fields
    return camelCaseData.map((project: any) => ({
      id: project.id || `unknown-${Date.now()}`,
      name: project.title || project.name || "Untitled Project", 
      createdAt: project.createdAt || project.created_at || new Date().toISOString(), 
      description: project.description || "",
      status: project.status || "active",
      teamSize: project.teamSize || 1,
      lastUpdated: project.updatedAt || project.updated_at || project.createdAt || project.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return [] // Return empty array on error
  }
}

export async function createProject(title: string, description?: string, userId?: string) {
  if (USE_MOCK) {
    const newProject = {
      id: `project-${Date.now()}`,
      name: title,
      description: description || "",
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "active",
      teamSize: 1
    }
    mockProjects.push(newProject)
    return Promise.resolve(newProject)
  }

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE_URL}/projects/start`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ 
      title, 
      description, 
      user_id: userId 
    }),
  })

  const data = await res.json()
  return toCamelCase(data)
}

export async function getAppConfig(projectId: string) {
  if (USE_MOCK) return Promise.resolve(mockAppConfig)
  try {
    const res = await fetch(`${API_BASE_URL}/app-version/latest?project_id=${projectId}`)
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log("No app versions found for this project, returning empty config")
        // Return empty config for new projects
        return {
          app: {
            id: projectId,
            name: "New App",
            version: "0.1.0",
            description: "",
            createdBy: "user"
          },
          resources: {},
          pages: [],
          auth: { roles: [] },
          use_cases: []
        }
      }
      throw new Error(`Error fetching app config: ${res.status} ${res.statusText}`)
    }
    
    const data = await res.json()
    // First convert snake_case to camelCase
    const camelCaseData = toCamelCase(data)
    
    // If config_json is available, use that as the main structure
    if (camelCaseData.configJson) {
      // Extract the configuration
      const configJson = camelCaseData.configJson
      // Add metadata from the version
      return {
        ...configJson,
        app: {
          ...configJson.app,
          // Add any missing app metadata
          id: configJson.app?.id || camelCaseData.id,
          version: configJson.app?.version || camelCaseData.versionNumber?.toString() || "1.0.0",
          createdBy: configJson.app?.createdBy || "user",
        }
      }
    }
    
    // If we're here, the backend didn't return the expected structure
    console.warn('Backend returned unexpected app config structure:', camelCaseData);
    // Return a compatible empty structure
    return {
      app: {
        id: projectId,
        name: "New App",
        version: "0.1.0",
        description: "",
        createdBy: "user"
      },
      resources: {},
      pages: [],
      auth: { roles: [] },
      use_cases: []
    }
  } catch (error) {
    console.error("Failed to fetch app config:", error);
    // Return empty config rather than mock data
    return {
      app: {
        id: projectId,
        name: "New App",
        version: "0.1.0",
        description: "",
        createdBy: "user"
      },
      resources: {},
      pages: [],
      auth: { roles: [] },
      use_cases: []
    }
  }
}

const localMessages = [...mockMessages]

export async function getMessages(projectId: string) {
  if (USE_MOCK) return Promise.resolve(localMessages)
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/messages`)
  const data = await res.json()
  
  // Convert snake_case to camelCase
  const camelCaseData = toCamelCase(data)
  
  // Map backend fields to frontend expected fields
  return camelCaseData.map((message: any) => ({
    id: message.id,
    role: message.role,
    content: message.content
  }));
}

export async function postMessage(projectId: string, message: string) {
  const newUserMsg = {
    id: `${Date.now()}`,
    role: "user",
    content: message,
  }

  const mockReply = {
    id: `${Date.now() + 1}`,
    role: "assistant",
    content: "This is a simulated agent reply from mock API.",
  }

  if (USE_MOCK) {
    localMessages.push(newUserMsg, mockReply)
    return Promise.resolve([mockReply])
  }

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/messages`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ content: message }),
  })

  const data = await res.json()
  return toCamelCase(data)
}

export async function getFlows() {
  if (USE_MOCK) return Promise.resolve(mockFlows)
  
  try {
    // Updated path to match the backend endpoint
    const res = await fetch(`${API_BASE_URL}/flow-config/flows`)
    
    // Check if the response is ok
    if (!res.ok) {
      console.error('Failed to fetch flows:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json()
    
    console.log('Raw flows data:', data);
    
    // Convert snake_case to camelCase
    const camelCaseData = toCamelCase(data)
    
    console.log('Camel case flows data:', camelCaseData);
    
    // Ensure camelCaseData is an array, fallback to empty array if not
    const flowsArray = Array.isArray(camelCaseData) ? camelCaseData : [];
    
    console.log('Flows array:', flowsArray);
    
    // Map backend fields to frontend expected fields
    return flowsArray.map((flow: any) => ({
      id: flow.id || `flow-${Math.random().toString(36).substr(2, 9)}`,
      name: flow.name || 'Unnamed Flow',
      version: flow.version || 1,
      description: flow.description || "",
      is_active: flow.isActive || false,
      start_message: flow.startMessage || null,
      complete_message: flow.completeMessage || null
    }));
  } catch (error) {
    console.error('Error fetching flows:', error);
    // Return mock data or empty array in case of error
    return USE_MOCK ? mockFlows : [];
  }
}

export async function createFlow(flowData: any) {
  if (USE_MOCK) {
    const newFlow = {
      ...flowData,
      id: `flow${Date.now()}`,
    }
    mockFlows.push(newFlow)
    return Promise.resolve(newFlow)
  }

  // Convert camelCase to snake_case for backend
  const snakeCaseData = Object.keys(flowData).reduce((result: any, key) => {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[snakeKey] = flowData[key];
    return result;
  }, {});

  const headers = await getAuthHeaders();

  // Updated path to match the backend endpoint
  const res = await fetch(`${API_BASE_URL}/flow-config/flows`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(snakeCaseData),
  })

  const data = await res.json()
  return toCamelCase(data)
}

export async function updateFlow(flowData: any) {
  if (USE_MOCK) {
    const index = mockFlows.findIndex((f) => f.id === flowData.id)
    if (index !== -1) {
      mockFlows[index] = flowData
      return Promise.resolve(flowData)
    }
    return Promise.reject(new Error("Flow not found"))
  }

  try {
    // Convert camelCase to snake_case for backend
    const snakeCaseData = Object.keys(flowData).reduce((result: any, key) => {
      // Skip the ID as it's used in the URL, not in the request body
      if (key === 'id') return result;
      
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[snakeKey] = flowData[key];
      return result;
    }, {});

    console.log('Sending flow data to backend:', JSON.stringify(snakeCaseData, null, 2));

    const headers = await getAuthHeaders();

    // Updated path to match the backend endpoint
    const res = await fetch(`${API_BASE_URL}/flow-config/flows/${flowData.id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(snakeCaseData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Flow update failed:', errorData);
      throw new Error(errorData.detail || `Failed to update flow: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return toCamelCase(data);
  } catch (error) {
    console.error("Error updating flow:", error);
    throw error;
  }
}

export async function getFlowSteps(flowId: string) {
  if (USE_MOCK) return Promise.resolve(mockSteps.filter((s) => s.flow_id === flowId))
  
  try {
    // Updated path to match the backend endpoint
    const res = await fetch(`${API_BASE_URL}/flow-config/flows/${flowId}/steps`)
    
    if (!res.ok) {
      console.error('Failed to fetch flow steps:', res.status, res.statusText);
      const errorData = await res.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return [];
    }
    
    const data = await res.json()
    console.log('Raw flow steps data:', data);
    
    // Convert snake_case to camelCase
    const camelCaseData = toCamelCase(data)
    console.log('Camel case steps data:', camelCaseData);
    
    // Ensure we have an array
    const stepsArray = Array.isArray(camelCaseData) ? camelCaseData : [];
    
    // Map backend fields to frontend expected format with proper type handling
    return stepsArray.map((step: any) => {
      // Ensure output_schema is an object
      let outputSchema = step.outputSchema;
      if (typeof outputSchema === 'string') {
        try {
          outputSchema = JSON.parse(outputSchema);
        } catch (e) {
          console.error('Error parsing output schema:', e);
          outputSchema = {};
        }
      }
      
      // Ensure oneshot_examples is an array of objects
      let oneshotExamples = step.oneshotExamples;
      if (typeof oneshotExamples === 'string') {
        try {
          oneshotExamples = JSON.parse(oneshotExamples);
        } catch (e) {
          console.error('Error parsing oneshot examples:', e);
          oneshotExamples = [];
        }
      }
      
      // Ensure input_map is an object
      let inputMap = step.inputMap;
      if (typeof inputMap === 'string') {
        try {
          inputMap = JSON.parse(inputMap);
        } catch (e) {
          console.error('Error parsing input map:', e);
          inputMap = {};
        }
      }
      
      const mappedStep = {
        id: step.id,
        flow_id: step.flowId,
        name: step.name,
        step_type: step.stepType,
        tool_name: step.toolName,
        order: step.order,
        input_map: inputMap || {},
        loop_key: step.loopKey,
        system_message: step.systemMessage || '',
        prompt_template_id: step.promptTemplateId,
        output_schema_id: step.outputSchemaId,
        one_shot_id: step.oneShotId,
        start_message: step.startMessage || '',
        complete_message: step.completeMessage || '',
        // Content fields with proper type handling
        prompt_template: step.promptTemplate || '',
        output_schema: outputSchema || {},
        oneshot_examples: Array.isArray(oneshotExamples) ? oneshotExamples : [],
        
        // New Pydantic schema fields
        pydantic_schema_id: step.pydanticSchemaId,
        pydantic_schema_file_path: step.pydanticSchemaFilePath || '',
        pydantic_schema_class_name: step.pydanticSchemaClassName || '',
      };
      
      console.log(`Processed step ${step.id}:`, mappedStep);
      return mappedStep;
    });
  } catch (error) {
    console.error('Error fetching flow steps:', error);
    return USE_MOCK ? mockSteps.filter((s) => s.flow_id === flowId) : [];
  }
}

// Helper function to standardize step response data
function processStepResponse(stepData: any) {
  // Process output_schema
  let outputSchema = stepData.outputSchema;
  if (typeof outputSchema === 'string') {
    try {
      outputSchema = JSON.parse(outputSchema);
    } catch (e) {
      console.error('Error parsing output schema:', e);
      outputSchema = {};
    }
  }
  
  // Process oneshot_examples
  let oneshotExamples = stepData.oneshotExamples;
  if (typeof oneshotExamples === 'string') {
    try {
      oneshotExamples = JSON.parse(oneshotExamples);
    } catch (e) {
      console.error('Error parsing oneshot examples:', e);
      oneshotExamples = [];
    }
  }
  
  // Process input_map
  let inputMap = stepData.inputMap;
  if (typeof inputMap === 'string') {
    try {
      inputMap = JSON.parse(inputMap);
    } catch (e) {
      console.error('Error parsing input map:', e);
      inputMap = {};
    }
  }
  
  return {
    ...stepData,
    input_map: inputMap || {},
    output_schema: outputSchema || {},
    oneshot_examples: Array.isArray(oneshotExamples) ? oneshotExamples : [],
    system_message: stepData.systemMessage || '',
    prompt_template: stepData.promptTemplate || '',
    start_message: stepData.startMessage || '',
    complete_message: stepData.completeMessage || ''
  };
}

export async function createStep(stepData: any) {
  if (USE_MOCK) {
    const newStep = {
      ...stepData,
      id: stepData.id.startsWith("step") ? `s${Date.now()}` : stepData.id,
    }
    mockSteps.push(newStep)
    return Promise.resolve(newStep)
  }

  try {
    // Prepare data for backend
    const requestData = {
      id: stepData.id.startsWith("step") ? undefined : stepData.id, // Don't send temp IDs
      flow_id: stepData.flow_id,
      name: stepData.name,
      step_type: stepData.step_type,
      tool_name: stepData.tool_name,
      order: stepData.order,
      input_map: parseJsonField(stepData.input_map),
      loop_key: stepData.loop_key,
      system_message: stepData.system_message,
      start_message: stepData.start_message,
      complete_message: stepData.complete_message,
      // Content fields
      prompt_template: stepData.prompt_template,
      output_schema: parseJsonField(stepData.output_schema),
      oneshot_examples: parseJsonField(stepData.oneshot_examples),
      
      // New Pydantic schema fields
      pydantic_schema_file_path: stepData.pydantic_schema_file_path || undefined,
      pydantic_schema_class_name: stepData.pydantic_schema_class_name || undefined,
    };

    console.log('Sending step data to backend:', JSON.stringify(requestData, null, 2));

    const res = await fetch(`${API_BASE_URL}/flow-config/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Step creation failed:', errorData);
      throw new Error(errorData.detail || 'Failed to create step');
    }

    const data = await res.json();
    const processedData = processStepResponse(toCamelCase(data));
    console.log('Processed step response:', processedData);
    return processedData;
  } catch (error) {
    console.error("Error creating step:", error);
    if (USE_MOCK) {
      // Fall back to mock data in development
      const newStep = {
        ...stepData,
        id: stepData.id.startsWith("step") ? `s${Date.now()}` : stepData.id,
      };
      mockSteps.push(newStep);
      return newStep;
    }
    throw error;
  }
}

export async function updateStep(stepData: any) {
  if (USE_MOCK) {
    const index = mockSteps.findIndex((s) => s.id === stepData.id)
    if (index !== -1) {
      mockSteps[index] = stepData
      return Promise.resolve(stepData)
    }
    return Promise.reject(new Error("Step not found"))
  }

  try {
    // Prepare data for backend - same format as createStep
    const requestData = {
      id: stepData.id,
      flow_id: stepData.flow_id,
      name: stepData.name,
      step_type: stepData.step_type,
      tool_name: stepData.tool_name,
      order: stepData.order,
      input_map: parseJsonField(stepData.input_map),
      loop_key: stepData.loop_key,
      system_message: stepData.system_message,
      start_message: stepData.start_message,
      complete_message: stepData.complete_message,
      // Content fields
      prompt_template: stepData.prompt_template,
      output_schema: parseJsonField(stepData.output_schema),
      oneshot_examples: parseJsonField(stepData.oneshot_examples),
      
      // New Pydantic schema fields
      pydantic_schema_file_path: stepData.pydantic_schema_file_path || undefined,
      pydantic_schema_class_name: stepData.pydantic_schema_class_name || undefined,
    };

    console.log('Sending step data to backend for update:', JSON.stringify(requestData, null, 2));

    const res = await fetch(`${API_BASE_URL}/flow-config/steps`, {
      method: "POST", // Same endpoint for create and update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Step update failed:', errorData);
      throw new Error(errorData.detail || 'Failed to update step');
    }

    const data = await res.json();
    const processedData = processStepResponse(toCamelCase(data));
    console.log('Processed step update response:', processedData);
    return processedData;
  } catch (error) {
    console.error("Error updating step:", error);
    if (USE_MOCK) {
      // Fall back to mock data in development
      const index = mockSteps.findIndex((s) => s.id === stepData.id);
      if (index !== -1) {
        mockSteps[index] = stepData;
        return stepData;
      }
      throw new Error("Step not found");
    }
    throw error;
  }
}

export async function deleteStep(stepId: string) {
  if (USE_MOCK) {
    const index = mockSteps.findIndex((s) => s.id === stepId)
    if (index !== -1) {
      mockSteps.splice(index, 1)
      return Promise.resolve({ success: true })
    }
    return Promise.reject(new Error("Step not found"))
  }

  // Updated path - we'll disable this functionality for now
  console.warn('Step deletion endpoint not available in backend');
  if (USE_MOCK) {
    return Promise.resolve({ success: true })
  }
  return Promise.reject(new Error("Step deletion endpoint not implemented"))
}

export async function getVersions(projectId: string) {
  if (USE_MOCK) return Promise.resolve(mockVersions)
  
  try {
    const res = await fetch(`${API_BASE_URL}/app-version/project/${projectId}`)
    
    if (!res.ok) {
      if (res.status === 404) {
        return []
      }
      throw new Error(`Error fetching versions: ${res.statusText}`)
    }
    
    const data = await res.json()
    
    // Convert the data to the expected format
    return data.map((version: any) => ({
      id: version.id,
      project_id: version.project_id,
      flow_run_id: version.flow_run_id,
      version_number: version.version_number,
      config_json: version.config_json,
      created_at: version.created_at,
      is_current: false // This would need to be determined separately
    }))
  } catch (error) {
    console.error("Failed to fetch versions:", error)
    return []
  }
}

export async function getFlowRuns(projectId: string) {
  if (USE_MOCK) return Promise.resolve(mockFlowRuns)
  
  try {
    const res = await fetch(`${API_BASE_URL}/flow-runs/project/${projectId}`)
    
    if (!res.ok) {
      if (res.status === 404) {
        return []
      }
      throw new Error(`Error fetching flow runs: ${res.statusText}`)
    }
    
    const data = await res.json()
    return data
  } catch (error) {
    console.error("Failed to fetch flow runs:", error)
    return []
  }
}

export async function getStepRuns(flowRunId: string) {
  if (USE_MOCK) return Promise.resolve(mockStepRuns.filter((s) => s.flow_run_id === flowRunId))
  
  try {
    const res = await fetch(`${API_BASE_URL}/flow-runs/${flowRunId}/steps`)
    
    if (!res.ok) {
      if (res.status === 404) {
        return []
      }
      throw new Error(`Error fetching step runs: ${res.status} ${res.statusText}`)
    }
    
    const data = await res.json()
    
    // Convert snake_case to camelCase
    const camelCaseData = toCamelCase(data)
    
    // Ensure we have an array
    if (!Array.isArray(camelCaseData)) {
      console.error('Step runs data is not an array:', camelCaseData)
      return []
    }
    
    // Map backend fields to frontend expected format
    return camelCaseData.map((stepRun: any) => ({
      id: stepRun.id,
      flow_run_id: stepRun.flowRunId,
      step_id: stepRun.stepId,
      status: stepRun.status,
      step_name: stepRun.stepName || "Unknown Step",
      started_at: stepRun.startedAt,
      ended_at: stepRun.endedAt,
      input_data: stepRun.inputData || {},
      output_data: stepRun.outputData || {},
      rendered_prompt: stepRun.renderedPrompt,
      error_message: stepRun.errorMessage,
      created_at: stepRun.createdAt,
      duration: stepRun.duration
    }))
  } catch (error) {
    console.error("Error fetching step runs:", error)
    return []
  }
}

export async function replayStep(stepRunId: string, payload: any) {
  if (USE_MOCK) {
    return Promise.resolve({
      message: "Replay simulated (mock)",
      result: {
        status: "success",
        replay_run_id: `replay-${Date.now()}`,
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
          ],
        },
        duration: 1.2,
      },
    })
  }

  try {
    // Convert frontend payload format to backend format
    const requestPayload = {
      input_data: payload.input_data || undefined,
      prompt_template: payload.prompt_template || undefined,
      output_schema: payload.output_schema ? JSON.parse(payload.output_schema) : undefined
    }

    const headers = await getAuthHeaders();

    const res = await fetch(`${API_BASE_URL}/flow-runs/step-runs/${stepRunId}/replay`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestPayload),
    })

    if (!res.ok) {
      const errorData = await res.json()
      return { 
        status: "error", 
        error: errorData.detail || "Failed to replay step", 
        duration: 0 
      }
    }

    const data = await res.json()
    
    // Convert snake_case to camelCase
    return toCamelCase(data)
  } catch (error) {
    console.error("Error replaying step:", error)
    return { 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error occurred", 
      duration: 0 
    }
  }
}

export async function getResources(appId: string) {
  if (USE_MOCK) return Promise.resolve(mockResources)
  // This endpoint doesn't exist in backend yet
  console.warn('Resources endpoint not available in backend');
  if (USE_MOCK) {
    return Promise.resolve(mockResources)
  }
  return Promise.reject(new Error("Resources endpoint not implemented"))
}

// Helper function to ensure JSON fields are properly parsed
function parseJsonField(field: any): any {
  if (!field) return {};
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing JSON field:', error);
      return {};
    }
  }
  
  return field;
}

export async function startProjectWithMessage(message: string, title: string = "New Project", description?: string, userId?: string) {
  if (USE_MOCK) {
    const newProject = {
      id: `project-${Date.now()}`,
      name: title,
      description: description || "",
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "active",
      teamSize: 1
    }
    mockProjects.push(newProject)
    
    const mockReply = {
      id: `${Date.now() + 1}`,
      role: "assistant",
      content: "This is a simulated agent reply from mock API.",
    }
    
    return Promise.resolve({
      project: newProject,
      status: "processing"
    })
  }

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE_URL}/projects/start-with-message`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ 
      title, 
      description, 
      user_id: userId,
      message
    }),
  })

  const data = await res.json()
  return toCamelCase(data)
}
