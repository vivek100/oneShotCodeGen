"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Save, AlertTriangle } from "lucide-react"

interface UseCasesTabProps {
  appConfig: any
  setAppConfig: React.Dispatch<React.SetStateAction<any>>
}

export default function UseCasesTab({ appConfig, setAppConfig }: UseCasesTabProps) {
  const [useCases, setUseCases] = useState(
    appConfig.useCases || []
  )

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingUseCase, setEditingUseCase] = useState<any>(null)

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditingUseCase({ ...useCases[index] })
  }

  const handleSave = () => {
    if (editingIndex === null || !editingUseCase) return

    const newUseCases = [...useCases]
    newUseCases[editingIndex] = editingUseCase
    setUseCases(newUseCases)

    // Update app config
    const newConfig = { ...appConfig }
    newConfig.use_cases = newUseCases
    setAppConfig(newConfig)

    setEditingIndex(null)
    setEditingUseCase(null)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditingUseCase(null)
  }

  const handleChange = (field: string, value: any) => {
    if (!editingUseCase) return
    setEditingUseCase({ ...editingUseCase, [field]: value })
  }

  const handleArrayChange = (field: string, value: string) => {
    if (!editingUseCase) return
    setEditingUseCase({
      ...editingUseCase,
      [field]: value.split("\n").filter((item) => item.trim() !== ""),
    })
  }

  const handleAddNew = () => {
    setEditingIndex(useCases.length)
    setEditingUseCase({
      use_case_name: "",
      goal: "",
      actors: [],
      flow: [],
      pre_conditions: [],
    })
  }

  const isEmptyState = !useCases || useCases.length === 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Use Cases</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isEmptyState ? "Add First Use Case" : "Add Use Case"}
        </Button>
      </div>

      {editingIndex !== null && editingUseCase && (
        <Card>
          <CardHeader>
            <CardTitle>{editingIndex < useCases.length ? "Edit" : "Add"} Use Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="use_case_name">Name</Label>
                <Input
                  id="use_case_name"
                  value={editingUseCase.useCaseName}
                  onChange={(e) => handleChange("use_case_name", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="goal">Goal</Label>
                <Textarea
                  id="goal"
                  value={editingUseCase.goal}
                  onChange={(e) => handleChange("goal", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="actors">Actors (one per line)</Label>
                <Textarea
                  id="actors"
                  value={editingUseCase.actors.join("\n")}
                  onChange={(e) => handleArrayChange("actors", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="flow">Flow Steps (one per line)</Label>
                <Textarea
                  id="flow"
                  value={editingUseCase.flow.join("\n")}
                  onChange={(e) => handleArrayChange("flow", e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="preConditions">Pre-conditions (one per line)</Label>
                <Textarea
                  id="preConditions"
                  value={editingUseCase.preConditions.join("\n")}
                  onChange={(e) => handleArrayChange("preConditions", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isEmptyState && editingIndex === null ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No Use Cases Defined</h2>
              <p className="text-muted-foreground max-w-md">
                Define use cases to help outline how users will interact with your application. 
                Click the "Add First Use Case" button to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {useCases.map((useCase: any, index: number) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg">
              <AccordionTrigger className="px-4">
                <div className="flex justify-between items-center w-full pr-4">
                  <span>{useCase.useCaseName}</span>
                  {editingIndex !== index && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(index)
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Goal</h4>
                    <p className="text-muted-foreground">{useCase.goal}</p>
                  </div>

                  <div>
                    <h4 className="font-medium">Actors</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {useCase.actors.map((actor: string, i: number) => (
                        <li key={i}>{actor}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">Flow</h4>
                    <ol className="list-decimal pl-5 text-muted-foreground">
                      {useCase.flow.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium">Pre-conditions</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {useCase.preConditions.map((condition: string, i: number) => (
                        <li key={i}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
