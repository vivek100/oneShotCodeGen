"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { mockApi } from "../lib/mockApi"
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react"

// Simplified field interface
interface Field {
  name: string
  label: string
  type: "text" | "number" | "select" | "boolean" | "date" | "reference"
  required?: boolean
  reference?: {
    resource: string
    displayField: string
  }
  options?: string[]
}

// Simplified step interface
interface Step {
  title: string
  fields: Field[]
}

// Simplified props
interface WizardFormProps {
  steps: Step[]
  resource: string
  submitAction: "create" | "update"
  initialValues?: Record<string, any>
  redirectPath?: string
}

export default function WizardForm({
  steps,
  resource,
  submitAction,
  initialValues = {},
  redirectPath,
}: WizardFormProps) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({})

  // Load initial data if in edit mode
  useEffect(() => {
    const loadData = async () => {
      if (submitAction === "update" && initialValues.id) {
        try {
          setLoading(true)
          const result = await mockApi.getOne(resource, initialValues.id)
          setValues(result.data)
        } catch (err) {
          console.error("Error loading data:", err)
          setErrors({ _form: "Failed to load data" })
        } finally {
          setLoading(false)
        }
      } else {
        setValues(initialValues)
      }

      // Load reference data for all steps
      const allFields = steps.flatMap((step) => step.fields)
      const referencesToLoad = allFields
        .filter((field) => field.reference)
        .map((field) => field.reference!.resource)
        .filter((value, index, self) => self.indexOf(value) === index) // Unique values

      const refData: Record<string, any[]> = {}

      for (const refResource of referencesToLoad) {
        try {
          const refResult = await mockApi.getList(refResource)
          refData[refResource] = refResult.data
        } catch (err) {
          console.error(`Error loading reference data for ${refResource}:`, err)
        }
      }

      setReferenceData(refData)
    }

    loadData()
    // Use JSON.stringify for objects in dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, JSON.stringify(initialValues), JSON.stringify(steps), submitAction])

  // Handle input change
  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate current step
  const validateStep = (): boolean => {
    const currentFields = steps[currentStep].fields
    const newErrors: Record<string, string> = {}

    currentFields.forEach((field) => {
      const value = values[field.name]

      if (field.required && (value === undefined || value === null || value === "")) {
        newErrors[field.name] = `${field.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) return

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return

    try {
      setSubmitting(true)

      if (submitAction === "create") {
        await mockApi.create(resource, values)
      } else if (submitAction === "update" && values.id) {
        await mockApi.update(resource, values.id, values)
      }

      // Redirect after successful submission
      if (redirectPath) {
        navigate(redirectPath)
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      setErrors({ _form: "Failed to submit form" })
    } finally {
      setSubmitting(false)
    }
  }

  // Render a field based on its type
  const renderField = (field: Field) => {
    const value = values[field.name]
    const error = errors[field.name]

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === true}
              onCheckedChange={(checked) => handleChange(field.name, checked)}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select
              value={value || "placeholder"}
              onValueChange={(val) => handleChange(field.name, val === "placeholder" ? "" : val)}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  Select {field.label}
                </SelectItem>
                {field.options?.map((option, i) => (
                  <SelectItem key={i} value={option || `option-${i}`}>
                    {option || "Unnamed option"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "reference":
        if (field.reference) {
          const refResource = field.reference.resource
          const refField = field.reference.displayField
          const options = referenceData[refResource] || []

          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Select
                value={value || "placeholder"}
                onValueChange={(val) => handleChange(field.name, val === "placeholder" ? "" : val)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Select {field.label}
                  </SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id || `option-${option.id}`}>
                      {option[refField] || "Unnamed option"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )
        }
        return null
      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="date"
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="number"
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="text"
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const currentStepData = steps[currentStep]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {submitAction === "create" ? "Create" : "Edit"} {resource}
        </CardTitle>
        <CardDescription>
          Step {currentStep + 1} of {steps.length}: {currentStepData.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-2 border-primary bg-background text-primary"
                        : "border border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="mt-1 text-xs">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 h-1 w-full bg-muted" />
            <div
              className="absolute top-0 h-1 bg-primary transition-all duration-300 ease-in-out"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current step fields */}
        <div className="space-y-4">
          {currentStepData.fields.map((field) => (
            <div key={field.name}>{renderField(field)}</div>
          ))}
          {errors._form && <p className="text-sm text-destructive">{errors._form}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || submitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitAction === "create" ? "Creating..." : "Updating..."}
              </>
            ) : submitAction === "create" ? (
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
