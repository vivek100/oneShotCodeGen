"use client"

import { useState, useEffect, useRef } from "react"
import { getFlows, getFlowSteps, updateFlow, updateStep, createStep, deleteStep } from "@/api/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  FileText,
  MessageSquare,
  FileJson,
  Code,
  Zap,
  AlertCircle
} from "lucide-react"
import SimpleEditor from "@/components/simple-editor"
import debounce from "lodash/debounce"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FlowEditorProps {
  initialFlows: any[]
}

export default function FlowEditor({ initialFlows }: FlowEditorProps) {
  const [flows, setFlows] = useState<any[]>([])
  const [selectedFlow, setSelectedFlow] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [selectedStep, setSelectedStep] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const { isCloudMode } = useAuth()
  
  // Use local state for input fields to avoid re-renders
  const [editedInput, setEditedInput] = useState("")
  const [editedPrompt, setEditedPrompt] = useState("")
  const [editedSchema, setEditedSchema] = useState("")
  const [editedOneshot, setEditedOneshot] = useState("")
  
  // New state for Pydantic schema fields
  const [editedPydanticFilePath, setEditedPydanticFilePath] = useState("")
  const [editedPydanticClassName, setEditedPydanticClassName] = useState("")
  
  // Flow details editing state
  const [editedFlowName, setEditedFlowName] = useState("")
  const [editedFlowDescription, setEditedFlowDescription] = useState("")
  const [editedFlowStartMessage, setEditedFlowStartMessage] = useState("")
  const [editedFlowCompleteMessage, setEditedFlowCompleteMessage] = useState("")
  
  // Use a ref to track if we should update the main state
  const shouldUpdateRef = useRef(false)
  
  // Create a debounced function to update the selected step state
  const debouncedUpdateStep = useRef(
    debounce((field: string, value: any) => {
      if (selectedStep) {
        setSelectedStep((prev: any) => ({ ...prev, [field]: value }))
      }
    }, 500)
  ).current

  useEffect(() => {
    const loadFlows = async () => {
      setIsLoading(true)
      try {
        const flowsData = await getFlows()
        setFlows(flowsData)
        if (flowsData.length > 0 && !selectedFlow) {
          setSelectedFlow(flowsData[0])
          // Initialize flow editing fields
          setEditedFlowName(flowsData[0].name || "")
          setEditedFlowDescription(flowsData[0].description || "")
          setEditedFlowStartMessage(flowsData[0].start_message || "")
          setEditedFlowCompleteMessage(flowsData[0].complete_message || "")
        }
      } catch (error) {
        console.error("Error loading flows:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFlows()
  }, [])

  useEffect(() => {
    const loadSteps = async () => {
      if (!selectedFlow) return

      setIsLoading(true)
      try {
        const stepsData = await getFlowSteps(selectedFlow.id)
        setSteps(stepsData)
      } catch (error) {
        console.error("Error loading steps:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSteps()
  }, [selectedFlow])

  const handleFlowSelect = (flow: any) => {
    setSelectedFlow(flow)
    setSelectedStep(null)
    // Update flow editing fields when selecting a flow
    setEditedFlowName(flow.name || "")
    setEditedFlowDescription(flow.description || "")
    setEditedFlowStartMessage(flow.start_message || "")
    setEditedFlowCompleteMessage(flow.complete_message || "")
  }

  const handleStepSelect = (step: any) => {
    // Process the step data to ensure correct format
    const processedStep = {
      ...step,
      prompt_template: step.prompt_template || "",
      output_schema: step.output_schema || {},
      input_map: step.input_map || {},
      oneshot_examples: step.oneshot_examples || []
    };
    
    setSelectedStep(processedStep)
    
    // Format and set the editor values
    setEditedPrompt(processedStep.prompt_template || "");
    
    setEditedSchema(
      typeof processedStep.output_schema === 'object' 
        ? JSON.stringify(processedStep.output_schema, null, 2)
        : typeof processedStep.output_schema === 'string'
          ? processedStep.output_schema
          : JSON.stringify({}, null, 2)
    );
    
    setEditedInput(
      typeof processedStep.input_map === 'object'
        ? JSON.stringify(processedStep.input_map, null, 2)
        : typeof processedStep.input_map === 'string'
          ? processedStep.input_map
          : JSON.stringify({}, null, 2)
    );
    
    setEditedOneshot(
      Array.isArray(processedStep.oneshot_examples)
        ? JSON.stringify(processedStep.oneshot_examples, null, 2)
        : typeof processedStep.oneshot_examples === 'string'
          ? processedStep.oneshot_examples
          : JSON.stringify([], null, 2)
    );
    
    // Set the Pydantic schema fields
    setEditedPydanticFilePath(processedStep.pydantic_schema_file_path || "");
    setEditedPydanticClassName(processedStep.pydantic_schema_class_name || "");
    
    setActiveTab("details")
  }

  const handleToggleFlow = async (flowId: string, newState: boolean) => {
    const flowToUpdate = flows.find((flow) => flow.id === flowId)
    if (!flowToUpdate) return

    try {
      const updatedFlow = await updateFlow({
        ...flowToUpdate,
        is_active: newState,
      })

      setFlows(flows.map((flow) => (flow.id === flowId ? updatedFlow : flow)))
    } catch (error) {
      console.error("Error updating flow:", error)
    }
  }

  const handleAddStep = () => {
    if (!selectedFlow) return

    // Define default values
    const defaultPromptTemplate = "// This is a sample prompt template\n\nAnalyze the following requirements:\n\n{{requirements}}\n\nExtract the key features and entities."
    
    const defaultOutputSchema = JSON.stringify({
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
    }, null, 2)
    
    const defaultOneshotExamples = JSON.stringify([
      {
        input: {
          requirements: "Build a CRM system with contact management and email tracking",
        },
        output: {
          features: ["Contact Management", "Email Tracking", "Dashboard"],
          entities: ["Contact", "Email", "User"],
        },
      },
    ], null, 2)

    // Create the new step object with default values
    const newStep = {
      id: `step${Date.now()}`,
      flow_id: selectedFlow.id,
      name: "new_step",
      step_type: "ai_single",
      order: steps.length,
      input_map: {},
      system_message: "You are a helpful assistant.",
      prompt_template: defaultPromptTemplate,
      output_schema: defaultOutputSchema,
      oneshot_examples: defaultOneshotExamples,
      start_message: "",
      complete_message: "",
    }

    // Set the edited values for the editors and new pydantic fields
    setEditedPrompt(defaultPromptTemplate)
    setEditedSchema(defaultOutputSchema)
    setEditedInput(JSON.stringify({}, null, 2))
    setEditedOneshot(defaultOneshotExamples)
    
    // Set the selected step and active tab
    setSelectedStep(newStep)
    setActiveTab("details")
  }

  const handleSaveStep = async () => {
    if (!selectedStep) return

    setIsLoading(true)
    try {
      // Save current edited values to ensure they're not lost during API call
      const currentEditedValues = {
        prompt_template: editedPrompt,
        output_schema: editedSchema,
        input_map: editedInput,
        oneshot_examples: editedOneshot,
      };
      
      // Check if it's a new step
      const isNewStep = !steps.find((step) => step.id === selectedStep.id)

      // Parse JSON fields properly to ensure correct format
      let parsedOutputSchema = {};
      try {
        parsedOutputSchema = typeof editedSchema === 'string' ? JSON.parse(editedSchema) : editedSchema;
      } catch (e) {
        console.error("Error parsing output schema:", e);
      }
      
      let parsedInputMap = {};
      try {
        parsedInputMap = typeof editedInput === 'string' ? JSON.parse(editedInput) : editedInput;
      } catch (e) {
        console.error("Error parsing input map:", e);
      }
      
      let parsedOneshotExamples = [];
      try {
        parsedOneshotExamples = typeof editedOneshot === 'string' ? JSON.parse(editedOneshot) : editedOneshot;
      } catch (e) {
        console.error("Error parsing oneshot examples:", e);
      }

      // Make sure to include all edited values in the step data before saving
      const stepToSave = {
        ...selectedStep,
        prompt_template: editedPrompt,
        output_schema: parsedOutputSchema, 
        input_map: parsedInputMap,
        oneshot_examples: parsedOneshotExamples,
      };

      console.log("Saving step with data:", stepToSave);

      let updatedStep: typeof selectedStep 
      if (isNewStep) {
        updatedStep = await createStep(stepToSave)
        setSteps([...steps, updatedStep])
      } else {
        updatedStep = await updateStep(stepToSave)
        setSteps(steps.map((step) => (step.id === selectedStep.id ? updatedStep : step)))
      }

      console.log("Received updated step from API:", updatedStep);
      
      // Correctly handle the updated step data, including new fields
      const processedStep = {
        ...updatedStep,
        prompt_template: updatedStep.prompt_template || currentEditedValues.prompt_template,
        output_schema: updatedStep.output_schema || {},
        input_map: updatedStep.input_map || {},
        oneshot_examples: updatedStep.oneshot_examples || [],
      };
      
      // Update local state with the processed step data
      setSelectedStep(processedStep);
      
      // Update the editor state values to match the returned data
      setEditedPrompt(processedStep.prompt_template || "");
      
      setEditedSchema(
        typeof processedStep.output_schema === 'object' 
          ? JSON.stringify(processedStep.output_schema, null, 2)
          : typeof processedStep.output_schema === 'string'
            ? processedStep.output_schema
            : JSON.stringify({}, null, 2)
      );
      
      setEditedInput(
        typeof processedStep.input_map === 'object'
          ? JSON.stringify(processedStep.input_map, null, 2)
          : typeof processedStep.input_map === 'string'
            ? processedStep.input_map
            : JSON.stringify({}, null, 2)
      );
      
      setEditedOneshot(
        Array.isArray(processedStep.oneshot_examples)
          ? JSON.stringify(processedStep.oneshot_examples, null, 2)
          : typeof processedStep.oneshot_examples === 'string'
            ? processedStep.oneshot_examples
            : JSON.stringify([], null, 2)
      );
      
      
    } catch (error) {
      console.error("Error saving step:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveStep = async (stepId: string, direction: "up" | "down") => {
    const stepIndex = steps.findIndex((step) => step.id === stepId)
    if (stepIndex === -1) return

    if (direction === "up" && stepIndex > 0) {
      const newSteps = [...steps]
      const stepToMove = { ...newSteps[stepIndex], order: stepIndex - 1 }
      const otherStep = { ...newSteps[stepIndex - 1], order: stepIndex }

      try {
        await updateStep(stepToMove)
        await updateStep(otherStep)

        newSteps[stepIndex] = otherStep
        newSteps[stepIndex - 1] = stepToMove
        setSteps(newSteps)
      } catch (error) {
        console.error("Error moving step:", error)
      }
    } else if (direction === "down" && stepIndex < steps.length - 1) {
      const newSteps = [...steps]
      const stepToMove = { ...newSteps[stepIndex], order: stepIndex + 1 }
      const otherStep = { ...newSteps[stepIndex + 1], order: stepIndex }

      try {
        await updateStep(stepToMove)
        await updateStep(otherStep)

        newSteps[stepIndex] = otherStep
        newSteps[stepIndex + 1] = stepToMove
        setSteps(newSteps)
      } catch (error) {
        console.error("Error moving step:", error)
      }
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    try {
      await deleteStep(stepId)
      setSteps(steps.filter((step) => step.id !== stepId))
      if (selectedStep?.id === stepId) {
        setSelectedStep(null)
      }
    } catch (error) {
      console.error("Error deleting step:", error)
    }
  }

  const handleStepChange = (field: string, value: any) => {
    if (!selectedStep) return
    
    // Update edited values for fields with code editors
    if (field === "prompt_template") {
      setEditedPrompt(value)
      debouncedUpdateStep(field, value)
    } else if (field === "output_schema") {
      setEditedSchema(value)
      debouncedUpdateStep(field, value)
    } else if (field === "input_map") {
      setEditedInput(value)
      try {
        const parsed = JSON.parse(value)
        debouncedUpdateStep(field, parsed)
      } catch (e) {
        // Handle JSON parse error
        console.error("Invalid JSON in input mapping")
      }
    } else if (field === "oneshot_examples") {
      setEditedOneshot(value)
      debouncedUpdateStep(field, value)
    } else {
      // For non-editor fields, update immediately
      setSelectedStep({ ...selectedStep, [field]: value })
    }
  }

  const handleSaveFlowDetails = async () => {
    if (!selectedFlow) return
    
    setIsLoading(true)
    try {
      // Only include fields that match the FlowUpdateRequest model in the backend
      const flowData = {
        id: selectedFlow.id, // Needed for the API route, but not part of the request body
        name: editedFlowName,
        description: editedFlowDescription,
        is_active: selectedFlow.is_active,
        start_message: editedFlowStartMessage,
        complete_message: editedFlowCompleteMessage
      }
      
      console.log("Saving flow with data:", flowData);
      
      const updatedFlow = await updateFlow(flowData)
      
      // Update the flows list with the updated flow
      setFlows(flows.map(flow => flow.id === updatedFlow.id ? updatedFlow : flow))
      // Update selected flow
      setSelectedFlow(updatedFlow)
      
    } catch (error) {
      console.error("Error saving flow details:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFlowDetailChange = (field: string, value: string) => {
    switch (field) {
      case "name":
        setEditedFlowName(value)
        break
      case "description":
        setEditedFlowDescription(value)
        break
      case "start_message":
        setEditedFlowStartMessage(value)
        break
      case "complete_message":
        setEditedFlowCompleteMessage(value)
        break
    }
  }

  const handleSaveChanges = async () => {
    if (selectedStep) {
      // Parse JSON fields properly before saving
      let parsedOutputSchema = {};
      try {
        parsedOutputSchema = typeof editedSchema === 'string' ? JSON.parse(editedSchema) : editedSchema;
      } catch (e) {
        console.error("Error parsing output schema in handleSaveChanges:", e);
      }
      
      let parsedInputMap = {};
      try {
        parsedInputMap = typeof editedInput === 'string' ? JSON.parse(editedInput) : editedInput;
      } catch (e) {
        console.error("Error parsing input map in handleSaveChanges:", e);
      }
      
      let parsedOneshotExamples = [];
      try {
        parsedOneshotExamples = typeof editedOneshot === 'string' ? JSON.parse(editedOneshot) : editedOneshot;
      } catch (e) {
        console.error("Error parsing oneshot examples in handleSaveChanges:", e);
      }
      
      // Update the selected step with the current edited values before saving
      const currentStep = {
        ...selectedStep,
        prompt_template: editedPrompt,
        output_schema: parsedOutputSchema,
        input_map: parsedInputMap,
        oneshot_examples: parsedOneshotExamples
      };
      
      setSelectedStep(currentStep);
      
      // Save the step with current values
      await handleSaveStep();
    } else if (selectedFlow) {
      // Save flow details if no step is selected but a flow is
      await handleSaveFlowDetails();
    }
  }

  return (
    <div className="container py-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Flow & Step Editor</h1>
        {isCloudMode ? (
          <Button disabled>Save Changes</Button>
        ) : (
          <Button onClick={handleSaveChanges} disabled={(!selectedStep && !selectedFlow) || isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
      
      {isCloudMode && (
        <Alert className="mb-6" variant="warning">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Flow editing is disabled in online version for now. To edit flows and steps, please use the open source version.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Flows Panel */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Flows</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className={`p-3 border rounded-md cursor-pointer hover:border-primary transition-colors ${
                      selectedFlow?.id === flow.id ? "border-primary bg-accent/30" : ""
                    }`}
                    onClick={() => handleFlowSelect(flow)}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{flow.name}</div>
                        <Badge
                          variant={flow.is_active ? "default" : "outline"}
                          className={
                            flow.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                              : ""
                          }
                        >
                          {flow.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">v{flow.version}</div>
                      <div className="text-xs text-muted-foreground">{flow.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Steps Panel */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Steps <Badge variant="outline">Click to view step details</Badge></CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddStep} 
                disabled={isCloudMode || true} /* disabling this button for now because we don't have a way to add steps yet, once you have replace it with "isCloudMode || !selectedFlow" */
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="p-3">
              {selectedFlow ? (
                <div className="space-y-2">
                  {steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-3 border rounded-md cursor-pointer hover:border-primary transition-colors ${
                          selectedStep?.id === step.id ? "border-primary bg-accent/30" : ""
                        }`}
                        onClick={() => handleStepSelect(step)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center max-w-[70%]">
                            <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="truncate">
                              <div className="font-medium truncate">{step.name}</div>
                              <div className="text-xs text-muted-foreground">{step.step_type}</div>
                            </div>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveStep(step.id, "up")
                              }}
                              disabled={isCloudMode || true} // disabling this button for now because we don't have a way to add steps yet, once you have replace it with "isCloudMode || index === 0" 
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveStep(step.id, "down")
                              }}
                              disabled={isCloudMode || true} // disabling this button for now because we don't have a way to add steps yet, once you have replace it with "isCloudMode || index === steps.length - 1" 
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStep(step.id)
                              }}
                              disabled={isCloudMode || true} // disabling this button for now because we don't have a way to add steps yet, once you have remove this
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Select a flow to view its steps
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step Editor Panel */}
        <div className="col-span-6">
          <Card className="h-full">
            {selectedStep ? (
              <>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      Editing: {selectedStep.name}
                      <Badge className="ml-2" variant="outline">
                        {selectedStep.step_type}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="overflow-x-auto pb-2">
                      <TabsList className="mb-4 bg-muted dark:bg-secondary w-max">
                        <TabsTrigger
                          value="details"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="prompt"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Prompt Template
                        </TabsTrigger>
                        <TabsTrigger
                          value="schema"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <FileJson className="mr-2 h-4 w-4" />
                          Output Schema
                        </TabsTrigger>
                        <TabsTrigger
                          value="input"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Input Mapping
                        </TabsTrigger>
                        <TabsTrigger
                          value="examples"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          One-Shot Examples
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="step-name">Name</Label>
                          <Input
                            id="step-name"
                            value={selectedStep.name}
                            onChange={(e) => handleStepChange("name", e.target.value)}
                            disabled={isCloudMode}
                          />
                        </div>
                        <div>
                          <Label htmlFor="step-type">Type</Label>
                          <select
                            id="step-type"
                            className="w-full p-2 border rounded-md"
                            value={selectedStep.step_type}
                            onChange={(e) => handleStepChange("step_type", e.target.value)}
                            disabled={isCloudMode}
                          >
                            <option value="ai_single">AI Single</option>
                            <option value="ai_loop">AI Loop</option>
                            <option value="tool_call">Tool Call</option>
                          </select>
                        </div>
                      </div>
                      {/* if step_type is ai_loop, show the loop key value which "loop_key" is the key of the loop */}
                      {selectedStep.step_type === "ai_loop" && (
                        <div>
                          <Label htmlFor="loop-key">Loop Key</Label>
                          <Input
                            id="loop-key"
                            value={selectedStep.loop_key}
                            onChange={(e) => handleStepChange("loop_key", e.target.value)}
                            disabled={isCloudMode}
                          />
                        </div>
                      )}

                      {/* if step_type is tool_call, show the tool name value which "tool_name" is the name of the tool */}
                      {selectedStep.step_type === "tool_call" && (
                        <div>
                          <Label htmlFor="tool-name">Tool Name</Label>
                          <Input
                            id="tool-name"
                            value={selectedStep.tool_name}
                            onChange={(e) => handleStepChange("tool_name", e.target.value)}
                            disabled={isCloudMode}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="system-message">System Message</Label>
                        <Textarea
                          id="system-message"
                          rows={3}
                          value={selectedStep.system_message}
                          onChange={(e) => handleStepChange("system_message", e.target.value)}
                          disabled={isCloudMode}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-message">Start Message</Label>
                          <Textarea
                            id="start-message"
                            value={selectedStep.start_message || ""}
                            onChange={(e) => handleStepChange("start_message", e.target.value)}
                            disabled={isCloudMode}
                          />
                        </div>
                        <div>
                          <Label htmlFor="complete-message">Complete Message</Label>
                          <Textarea
                            id="complete-message"
                            value={selectedStep.complete_message || ""}
                            onChange={(e) => handleStepChange("complete_message", e.target.value)}
                            disabled={isCloudMode}
                          />
                        </div>
                      </div>

                      {/* Fields for Pydantic schema */}                      
                      <div>
                        <Label htmlFor="pydantic-file-path">Pydantic Model File Path</Label>
                        <Input
                          id="pydantic-file-path"
                          value={selectedStep.pydantic_schema_file_path}
                          onChange={(e) => handleStepChange("pydantic_schema_file_path", e.target.value)}
                          placeholder="e.g., backend/models/pydantic/my_model.py"
                          disabled={isCloudMode}
                        />
                         <p className="text-xs text-muted-foreground mt-1">Path to the Pydantic model file relative to the project root.</p>
                      </div>
                      <div>
                        <Label htmlFor="pydantic-class-name">Pydantic Model Class Name</Label>
                        <Input
                          id="pydantic-class-name"
                          value={selectedStep.pydantic_schema_class_name}
                          onChange={(e) => handleStepChange("pydantic_schema_class_name", e.target.value)}
                          placeholder="e.g., MyOutputModel"
                          disabled={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Name of the Pydantic class within the file.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="prompt">
                      <div className="space-y-2">
                        <SimpleEditor
                          value={editedPrompt}
                          language="javascript"
                          onChange={(value) => handleStepChange("prompt_template", value)}
                          height="400px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use double curly braces for variables, e.g. {"{{variable_name}}"}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="schema">
                      <div className="space-y-2">
                        <SimpleEditor
                          value={editedSchema}
                          language="json"
                          onChange={(value) => handleStepChange("output_schema", value)}
                          height="400px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground">Define the JSON schema for the expected output</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="input">
                      <div className="space-y-2">
                        <SimpleEditor
                          value={editedInput}
                          language="json"
                          onChange={(value) => handleStepChange("input_map", value)}
                          height="400px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground">
                          Map input data to prompt variables. Use dot notation to access nested properties.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="examples">
                      <div className="space-y-2">
                        <SimpleEditor
                          value={editedOneshot}
                          language="json"
                          onChange={(value) => handleStepChange("oneshot_examples", value)}
                          height="400px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground">
                          Define one-shot examples to guide the model. Each example should have input and output fields.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : selectedFlow ? (
              <>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      Flow Details: {selectedFlow.name}
                      <Badge className="ml-2" variant={selectedFlow.is_active ? "default" : "outline"}>
                        {selectedFlow.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="flow-name">Flow Name</Label>
                      <Input
                        id="flow-name"
                        value={editedFlowName}
                        onChange={(e) => handleFlowDetailChange("name", e.target.value)}
                        disabled={isCloudMode}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="flow-description">Description</Label>
                      <Textarea
                        id="flow-description"
                        rows={3}
                        value={editedFlowDescription}
                        onChange={(e) => handleFlowDetailChange("description", e.target.value)}
                        disabled={isCloudMode}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="flow-is-active">Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="checkbox"
                          id="flow-is-active"
                          checked={selectedFlow.is_active}
                          onChange={(e) => {
                            setSelectedFlow({
                              ...selectedFlow,
                              is_active: e.target.checked
                            })
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={isCloudMode}
                        />
                        <Label htmlFor="flow-is-active" className="text-sm font-normal">
                          Active
                        </Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="flow-start-message">Start Message</Label>
                        <Textarea
                          id="flow-start-message"
                          value={editedFlowStartMessage}
                          onChange={(e) => handleFlowDetailChange("start_message", e.target.value)}
                          disabled={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Message displayed when the flow starts
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="flow-complete-message">Complete Message</Label>
                        <Textarea
                          id="flow-complete-message"
                          value={editedFlowCompleteMessage}
                          onChange={(e) => handleFlowDetailChange("complete_message", e.target.value)}
                          disabled={isCloudMode}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Message displayed when the flow completes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        onClick={handleSaveFlowDetails}
                        disabled={isCloudMode || isLoading}
                      >
                        {isLoading ? "Saving..." : "Save Flow Details"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Flow Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a flow from the list to edit its details.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
