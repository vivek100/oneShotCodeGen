"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, Info, Check } from "lucide-react"
import { TrackingStatusSection } from "@/components/tracking-status"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("openai")
  const [isSaving, setIsSaving] = useState(false)
  const [savedProvider, setSavedProvider] = useState<string | null>(null)

  // OpenAI settings
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [openaiModel, setOpenaiModel] = useState("gpt-4o")
  const [openaiEnabled, setOpenaiEnabled] = useState(true)

  // Groq settings
  const [groqApiKey, setGroqApiKey] = useState("")
  const [groqModel, setGroqModel] = useState("llama3-70b-8192")
  const [groqEnabled, setGroqEnabled] = useState(false)

  // XAI (Grok) settings
  const [xaiApiKey, setXaiApiKey] = useState("")
  const [xaiModel, setXaiModel] = useState("grok-1")
  const [xaiEnabled, setXaiEnabled] = useState(false)

  // OpenRouter settings
  const [openrouterApiKey, setOpenrouterApiKey] = useState("")
  const [openrouterModel, setOpenrouterModel] = useState("openai/gpt-4o")
  const [openrouterEnabled, setOpenrouterEnabled] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    // OpenAI
    const savedOpenaiApiKey = localStorage.getItem("openai_api_key")
    const savedOpenaiModel = localStorage.getItem("openai_model_name")
    const savedOpenaiEnabled = localStorage.getItem("openai_enabled")

    // Groq
    const savedGroqApiKey = localStorage.getItem("groq_api_key")
    const savedGroqModel = localStorage.getItem("groq_model_name")
    const savedGroqEnabled = localStorage.getItem("groq_enabled")

    // XAI (Grok)
    const savedXaiApiKey = localStorage.getItem("xai_api_key")
    const savedXaiModel = localStorage.getItem("xai_model_name")
    const savedXaiEnabled = localStorage.getItem("xai_enabled")

    // OpenRouter
    const savedOpenrouterApiKey = localStorage.getItem("openrouter_api_key")
    const savedOpenrouterModel = localStorage.getItem("openrouter_model_name")
    const savedOpenrouterEnabled = localStorage.getItem("openrouter_enabled")

    // Default provider
    const savedProvider = localStorage.getItem("default_provider")

    // Set states
    if (savedOpenaiApiKey) setOpenaiApiKey(savedOpenaiApiKey)
    if (savedOpenaiModel) setOpenaiModel(savedOpenaiModel)
    if (savedOpenaiEnabled) setOpenaiEnabled(savedOpenaiEnabled === "true")

    if (savedGroqApiKey) setGroqApiKey(savedGroqApiKey)
    if (savedGroqModel) setGroqModel(savedGroqModel)
    if (savedGroqEnabled) setGroqEnabled(savedGroqEnabled === "true")

    if (savedXaiApiKey) setXaiApiKey(savedXaiApiKey)
    if (savedXaiModel) setXaiModel(savedXaiModel)
    if (savedXaiEnabled) setXaiEnabled(savedXaiEnabled === "true")

    if (savedOpenrouterApiKey) setOpenrouterApiKey(savedOpenrouterApiKey)
    if (savedOpenrouterModel) setOpenrouterModel(savedOpenrouterModel)
    if (savedOpenrouterEnabled) setOpenrouterEnabled(savedOpenrouterEnabled === "true")

    if (savedProvider) setSavedProvider(savedProvider)
  }, [])

  const handleSave = () => {
    setIsSaving(true)

    // Determine default provider
    let defaultProvider = "openai"
    if (openaiEnabled) defaultProvider = "openai"
    else if (groqEnabled) defaultProvider = "groq"
    else if (xaiEnabled) defaultProvider = "xai"
    else if (openrouterEnabled) defaultProvider = "openrouter"

    // Save to localStorage
    // OpenAI
    localStorage.setItem("openai_api_key", openaiApiKey)
    localStorage.setItem("openai_model_name", openaiModel)
    localStorage.setItem("openai_enabled", openaiEnabled.toString())

    // Groq
    localStorage.setItem("groq_api_key", groqApiKey)
    localStorage.setItem("groq_model_name", groqModel)
    localStorage.setItem("groq_enabled", groqEnabled.toString())

    // XAI (Grok)
    localStorage.setItem("xai_api_key", xaiApiKey)
    localStorage.setItem("xai_model_name", xaiModel)
    localStorage.setItem("xai_enabled", xaiEnabled.toString())

    // OpenRouter
    localStorage.setItem("openrouter_api_key", openrouterApiKey)
    localStorage.setItem("openrouter_model_name", openrouterModel)
    localStorage.setItem("openrouter_enabled", openrouterEnabled.toString())

    // Default provider
    localStorage.setItem("default_provider", defaultProvider)
    setSavedProvider(defaultProvider)

    // Show success message
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "Your API settings have been saved successfully.",
      })
      setIsSaving(false)
    }, 500)
  }

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "openai":
        return "OpenAI"
      case "groq":
        return "Groq"
      case "xai":
        return "XAI (Grok)"
      case "openrouter":
        return "OpenRouter"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Provider Configuration</CardTitle>
            <CardDescription>
              Configure API settings for various model providers that support the OpenAI API format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-muted dark:bg-secondary">
                <TabsTrigger
                  value="openai"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  OpenAI
                </TabsTrigger>
                <TabsTrigger
                  value="groq"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  Groq
                </TabsTrigger>
                <TabsTrigger
                  value="xai"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  XAI (Grok)
                </TabsTrigger>
                <TabsTrigger
                  value="openrouter"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  OpenRouter
                </TabsTrigger>
              </TabsList>

              {/* OpenAI Settings */}
              <TabsContent value="openai" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="openai-enabled" checked={openaiEnabled} onCheckedChange={setOpenaiEnabled} />
                    <Label htmlFor="openai-enabled">Enable OpenAI</Label>
                  </div>
                  {savedProvider === "openai" && (
                    <div className="flex items-center text-sm text-primary">
                      <Check className="h-4 w-4 mr-1" />
                      Default Provider
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">API Key</Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    placeholder="sk-..."
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    disabled={!openaiEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI API key will be used for all OpenAI model operations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openai-model">Model</Label>
                  <Select value={openaiModel} onValueChange={setOpenaiModel} disabled={!openaiEnabled}>
                    <SelectTrigger id="openai-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the OpenAI model to use for generating content.
                  </p>
                </div>
              </TabsContent>

              {/* Groq Settings */}
              <TabsContent value="groq" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="groq-enabled" checked={groqEnabled} onCheckedChange={setGroqEnabled} />
                    <Label htmlFor="groq-enabled">Enable Groq</Label>
                  </div>
                  {savedProvider === "groq" && (
                    <div className="flex items-center text-sm text-primary">
                      <Check className="h-4 w-4 mr-1" />
                      Default Provider
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groq-api-key">API Key</Label>
                  <Input
                    id="groq-api-key"
                    type="password"
                    placeholder="gsk_..."
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    disabled={!groqEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your Groq API key will be used for all Groq model operations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groq-model">Model</Label>
                  <Select value={groqModel} onValueChange={setGroqModel} disabled={!groqEnabled}>
                    <SelectTrigger id="groq-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama3-70b-8192">Llama-3 70B</SelectItem>
                      <SelectItem value="llama3-8b-8192">Llama-3 8B</SelectItem>
                      <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                      <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Select the Groq model to use for generating content.</p>
                </div>
              </TabsContent>

              {/* XAI (Grok) Settings */}
              <TabsContent value="xai" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="xai-enabled" checked={xaiEnabled} onCheckedChange={setXaiEnabled} />
                    <Label htmlFor="xai-enabled">Enable XAI (Grok)</Label>
                  </div>
                  {savedProvider === "xai" && (
                    <div className="flex items-center text-sm text-primary">
                      <Check className="h-4 w-4 mr-1" />
                      Default Provider
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xai-api-key">API Key</Label>
                  <Input
                    id="xai-api-key"
                    type="password"
                    placeholder="xai-..."
                    value={xaiApiKey}
                    onChange={(e) => setXaiApiKey(e.target.value)}
                    disabled={!xaiEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your XAI (Grok) API key will be used for all Grok model operations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xai-model">Model</Label>
                  <Select value={xaiModel} onValueChange={setXaiModel} disabled={!xaiEnabled}>
                    <SelectTrigger id="xai-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok-1">Grok-1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the XAI (Grok) model to use for generating content.
                  </p>
                </div>
              </TabsContent>

              {/* OpenRouter Settings */}
              <TabsContent value="openrouter" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="openrouter-enabled"
                      checked={openrouterEnabled}
                      onCheckedChange={setOpenrouterEnabled}
                    />
                    <Label htmlFor="openrouter-enabled">Enable OpenRouter</Label>
                  </div>
                  {savedProvider === "openrouter" && (
                    <div className="flex items-center text-sm text-primary">
                      <Check className="h-4 w-4 mr-1" />
                      Default Provider
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openrouter-api-key">API Key</Label>
                  <Input
                    id="openrouter-api-key"
                    type="password"
                    placeholder="sk-or-..."
                    value={openrouterApiKey}
                    onChange={(e) => setOpenrouterApiKey(e.target.value)}
                    disabled={!openrouterEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your OpenRouter API key will be used to access multiple models through a single API.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openrouter-model">Model</Label>
                  <Select value={openrouterModel} onValueChange={setOpenrouterModel} disabled={!openrouterEnabled}>
                    <SelectTrigger id="openrouter-model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-4o">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="anthropic/claude-3-opus">Anthropic Claude 3 Opus</SelectItem>
                      <SelectItem value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</SelectItem>
                      <SelectItem value="meta-llama/llama-3-70b-instruct">Meta Llama 3 70B</SelectItem>
                      <SelectItem value="google/gemini-pro">Google Gemini Pro</SelectItem>
                      <SelectItem value="mistralai/mistral-large">Mistral Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Select the model to use through OpenRouter.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-1" />
              All API keys are stored locally in your browser.
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Additional configuration options for the AI Flow Builder.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="debug-mode" />
                <Label htmlFor="debug-mode">Enable Debug Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="cache-responses" defaultChecked />
                <Label htmlFor="cache-responses">Cache API Responses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="telemetry" defaultChecked />
                <Label htmlFor="telemetry">Allow Anonymous Usage Data</Label>
              </div>
              
              <div className="pt-4 border-t mt-4">
                <h3 className="text-lg font-medium mb-3">Privacy Settings</h3>
                <TrackingStatusSection />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
