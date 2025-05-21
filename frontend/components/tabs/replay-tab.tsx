"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getFlowRuns, getStepRuns, replayStep, getFlowSteps } from "@/api/api"
import { Play, RefreshCw, Code, FileJson, MessageSquare, FileOutput, Calendar, AlertTriangle, Terminal, AlertCircle } from "lucide-react"
import SimpleEditor from "@/components/simple-editor"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReplayTabProps {
  projectId: string
}

export default function ReplayTab({ projectId }: ReplayTabProps) {
  const [flowRuns, setFlowRuns] = useState<any[]>([])
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [selectedStep, setSelectedStep] = useState<any>(null)
  const [editedInput, setEditedInput] = useState<string>("")
  const [editedPrompt, setEditedPrompt] = useState<string>("")
  const [editedSchema, setEditedSchema] = useState<string>("")
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayResult, setReplayResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("input")
  const [isLoading, setIsLoading] = useState(false)
  const { isCloudMode } = useAuth()

  useEffect(() => {
    const loadFlowRuns = async () => {
      setIsLoading(true)
      try {
        const runsData = await getFlowRuns(projectId)
        setFlowRuns(runsData)
      } catch (error) {
        console.error("Error loading flow runs:", error)
        setFlowRuns([])
      } finally {
        setIsLoading(false)
      }
    }

    loadFlowRuns()
  }, [projectId])

  useEffect(() => {
    const loadStepRuns = async () => {
      if (!selectedRun) return

      setIsLoading(true)
      try {
        const stepsData = await getStepRuns(selectedRun.id)
        if (Array.isArray(stepsData)) {
          setSteps(stepsData)
        } else {
          console.error("Unexpected step data format:", stepsData)
          setSteps([])
        }
      } catch (error) {
        console.error("Error loading step runs:", error)
        setSteps([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStepRuns()
  }, [selectedRun])

  useEffect(() => {
    const loadStepData = async () => {
      if (selectedStep) {
        try {
          // Handle input data
        if (typeof selectedStep.input_data === 'string') {
          try {
            // If it's a string, try to parse it
            const parsedData = JSON.parse(selectedStep.input_data);
            setEditedInput(JSON.stringify(parsedData, null, 2));
          } catch (err) {
            // If parsing fails, use as-is
            setEditedInput(selectedStep.input_data || "{}");
          }
        } else {
          // If it's already an object
          setEditedInput(JSON.stringify(selectedStep.input_data || {}, null, 2));
        }

        // Handle prompt template
        //prompt_template data is not present we need to get by calling getFlowSteps with flow_id from selectedRun and then filter by step_id in selectedStep
        const flowSteps = await getFlowSteps(selectedRun.flow_id)
        const step = flowSteps.find((s: any) => s.id === selectedStep.step_id)
        setEditedPrompt(step?.prompt_template || "// No prompt template available");

        // Handle output schema
        //output_schema data is not present we need to get by calling getFlowSteps with flow_id from selectedRun and then filter by step_id in selectedStep

        if (typeof step?.output_schema === 'string') {
          try {
            const parsedSchema = JSON.parse(step?.output_schema);
            setEditedSchema(JSON.stringify(parsedSchema, null, 2));
          } catch (err) {
            setEditedSchema(step?.output_schema || "{}");
          }
        } else {
          setEditedSchema(JSON.stringify(step?.output_schema || {}, null, 2));
        }

        setReplayResult(null);
      } catch (error) {
        console.error("Error processing selected step data:", error);
          // Set defaults if there's an error
          setEditedInput("{}");
          setEditedPrompt("// No prompt template available");
          setEditedSchema("{}");
        }
      }
    }
    loadStepData()
  }, [selectedStep])

  const handleRunSelect = (run: any) => {
    setSelectedRun(run)
    setSelectedStep(null)
  }

  const handleStepSelect = (step: any) => {
    setSelectedStep(step)
    setActiveTab("input")
  }

  const handleReplay = async () => {
    if (!selectedStep) return

    setIsReplaying(true)

    try {
      let parsedInput
      try {
        parsedInput = JSON.parse(editedInput)
      } catch (error) {
        throw new Error("Invalid JSON in input data")
      }

      const payload = {
        input_data: parsedInput,
        prompt_template: editedPrompt,
        output_schema: editedSchema,
      }

      const result = await replayStep(selectedStep.id, payload)
      
      // Handle both new API format and mock response format
      const replayResult = result.result || result
      
      setReplayResult(replayResult)
      setActiveTab("result")
    } catch (error: any) {
      console.error("Error replaying step:", error)
      setReplayResult({
        status: "error",
        error: error.message || "Failed to replay step. Check your input JSON and schema.",
        duration: 0
      })
      setActiveTab("result")
    } finally {
      setIsReplaying(false)
    }
  }

  if (isLoading && flowRuns.length === 0) {
    return <div className="flex justify-center p-8">Loading flow runs...</div>
  }

  if (flowRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Flow Runs Available</h2>
        <p className="text-muted-foreground max-w-md">
          There are no flow runs for this project yet. Flow runs will be available after you generate your application.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isCloudMode && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Step replay is disabled in online version for now. To replay steps, please use the open source version.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-6">
        <div className="w-1/3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Play className="mr-2 h-4 w-4" />
                Flow Runs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {flowRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-3 border rounded-md cursor-pointer hover:border-primary transition-colors ${
                      selectedRun?.id === run.id ? "border-primary bg-accent/30" : ""
                    }`}
                    onClick={() => handleRunSelect(run)}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{run.flow_name}</div>
                        <Badge
                          variant={run.status === "complete" ? "default" : "outline"}
                          className={
                            run.status === "complete"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                              : ""
                          }
                        >
                          {run.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(run.started_at).toLocaleString()}
                      </div>
                      {run.duration && <div className="text-xs text-muted-foreground">Duration: {run.duration}s</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-2/3">
          {selectedRun ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Code className="mr-2 h-4 w-4" />
                    Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {steps.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No steps found for this flow run.</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible>
                      {steps.map((step) => (
                        <AccordionItem key={step.id} value={step.id}>
                          <AccordionTrigger className="px-4">
                            <div className="flex justify-between items-center w-full pr-4">
                              <div className="flex items-center">
                                <div className="font-medium">{step.step_name}</div>
                                <Badge
                                  variant={step.status === "success" ? "default" : "secondary"}
                                  className={
                                    step.status === "success"
                                      ? "ml-2 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                                      : "ml-2"
                                  }
                                >
                                  {step.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {step.duration && <span className="text-xs text-muted-foreground">{step.duration}s</span>}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStepSelect(step)
                                  }}
                                  disabled={isCloudMode}
                                >
                                  Select
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
                              <TabsList>
                                <TabsTrigger value="input">Input</TabsTrigger>
                                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                                <TabsTrigger value="output">Output</TabsTrigger>
                              </TabsList>
                              <TabsContent value="input">
                                <SimpleEditor
                                  value={
                                    (() => {
                                      try {
                                        // Handle case where input_data is a string that needs parsing
                                        if (typeof step.input_data === 'string') {
                                          return JSON.stringify(JSON.parse(step.input_data), null, 2);
                                        }
                                        // Handle normal object case
                                        return JSON.stringify(step.input_data || {}, null, 2);
                                      } catch (err) {
                                        console.warn("Error formatting input data:", err);
                                        return typeof step.input_data === 'string' 
                                          ? step.input_data 
                                          : "// Invalid or empty input data";
                                      }
                                    })()
                                  }
                                  language="json"
                                  readOnly
                                  height="150px"
                                />
                              </TabsContent>
                              <TabsContent value="prompt">
                                <SimpleEditor
                                  value={step.rendered_prompt}
                                  language="markdown"
                                  readOnly
                                  height="150px"
                                />
                              </TabsContent>
                              <TabsContent value="output">
                                <SimpleEditor
                                  value={
                                    (() => {
                                      try {
                                        // Handle case where output_data is a string that needs parsing
                                        if (typeof step.output_data === 'string') {
                                          return JSON.stringify(JSON.parse(step.output_data), null, 2);
                                        }
                                        // Handle normal object case
                                        return JSON.stringify(step.output_data || {}, null, 2);
                                      } catch (err) {
                                        console.warn("Error formatting output data:", err);
                                        return typeof step.output_data === 'string' 
                                          ? step.output_data 
                                          : "// Invalid or empty output data";
                                      }
                                    })()
                                  }
                                  language="json"
                                  readOnly
                                  height="150px"
                                />
                              </TabsContent>
                              <div className="flex justify-end">
                                <Button size="sm" onClick={() => handleStepSelect(step)} disabled={isCloudMode}>
                                  <Play className="mr-2 h-3 w-3" />
                                  Replay
                                </Button>
                              </div>
                            </Tabs>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {selectedStep && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Replay: {selectedStep.step_name}</CardTitle>
                      <Button onClick={handleReplay} disabled={isReplaying || isCloudMode}>
                        {isReplaying ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Replaying...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Replay Step
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-muted dark:bg-secondary">
                        <TabsTrigger
                          value="input"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <FileJson className="mr-2 h-4 w-4" />
                          Input Data
                        </TabsTrigger>
                        <TabsTrigger
                          value="prompt"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Prompt
                        </TabsTrigger>
                        <TabsTrigger
                          value="schema"
                          className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Schema
                        </TabsTrigger>
                        {selectedStep?.rendered_prompt && (
                          <TabsTrigger
                            value="generated-prompt"
                            className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                          >
                            <Terminal className="mr-2 h-4 w-4" />
                            Generated Prompt
                          </TabsTrigger>
                        )}
                        {replayResult && (
                          <TabsTrigger
                            value="result"
                            className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                          >
                            <FileOutput className="mr-2 h-4 w-4" />
                            Result
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="input" className="mt-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Edit the input data below and click Replay to run the step with the new input.
                          </p>
                          <SimpleEditor
                            value={editedInput}
                            language="json"
                            onChange={setEditedInput}
                            height="300px"
                            className="code-editor-fullscreen"
                            readOnly={isCloudMode}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="prompt" className="mt-4">
                        <SimpleEditor
                          value={editedPrompt}
                          language="javascript"
                          onChange={setEditedPrompt}
                          height="300px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                      </TabsContent>

                      <TabsContent value="schema" className="mt-4">
                        <SimpleEditor
                          value={editedSchema}
                          language="json"
                          onChange={setEditedSchema}
                          height="300px"
                          className="code-editor-fullscreen"
                          readOnly={isCloudMode}
                        />
                      </TabsContent>

                      {selectedStep?.rendered_prompt && (
                        <TabsContent value="generated-prompt" className="mt-4">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              This is the actual prompt sent to the AI model with all variables filled in.
                            </p>
                            <SimpleEditor
                              value={selectedStep.rendered_prompt}
                              language="markdown"
                              readOnly
                              height="300px"
                              className="code-editor-fullscreen"
                            />
                          </div>
                        </TabsContent>
                      )}

                      {replayResult && (
                        <TabsContent value="result" className="mt-4">
                          <div className="space-y-4">
                            {replayResult.error ? (
                              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                                <h4 className="font-medium">Error</h4>
                                <p>{replayResult.error}</p>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <Badge 
                                      variant={replayResult.status === "success" ? "default" : "secondary"}
                                      className={
                                        replayResult.status === "success"
                                          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                                          : ""
                                      }
                                    >
                                      {replayResult.status}
                                    </Badge>
                                    {replayResult.duration !== undefined && (
                                      <span className="ml-4 text-sm text-muted-foreground">
                                        Execution time: {replayResult.duration.toFixed(2)}s
                                      </span>
                                    )}
                                  </div>
                                  {replayResult.replay_run_id && (
                                    <div className="text-xs text-muted-foreground">
                                      Replay ID: {replayResult.replay_run_id}
                                    </div>
                                  )}
                                </div>
                                
                                {replayResult.rendered_prompt && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Generated Prompt</h4>
                                    <SimpleEditor
                                      value={replayResult.rendered_prompt}
                                      language="markdown"
                                      readOnly
                                      height="200px"
                                      className="code-editor-fullscreen"
                                    />
                                  </div>
                                )}
                                
                                <SimpleEditor
                                  value={(() => {
                                    try {
                                      // Handle case where output_data is a string that needs parsing
                                      if (typeof replayResult.output_data === 'string') {
                                        return JSON.stringify(JSON.parse(replayResult.output_data), null, 2);
                                      }
                                      // Handle normal object case
                                      return JSON.stringify(replayResult.output_data || {}, null, 2);
                                    } catch (err) {
                                      console.warn("Error formatting replay output data:", err);
                                      return typeof replayResult.output_data === 'string' 
                                        ? replayResult.output_data 
                                        : "// Invalid or empty output data";
                                    }
                                  })()}
                                  language="json"
                                  readOnly
                                  height="300px"
                                  className="code-editor-fullscreen"
                                />
                              </>
                            )}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a flow run to view its steps</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
