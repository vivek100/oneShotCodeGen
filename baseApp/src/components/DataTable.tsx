"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { mockApi } from "../lib/mockApi"
import { useApp } from "../context/AppContext"
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react"

// Simplified column interface
interface Column {
  field: string
  label: string
  type: "text" | "number" | "date" | "boolean" | "select" | "reference"
  options?: string[] | { label: string; value: string }[]
  reference?: {
    resource: string
    displayField: string
    valueField: string
  }
}

// Simplified filter interface
interface Filter {
  field: string
  label: string
  type: "text" | "select" | "date" | "number"
  options?: string[]
}

// Simplified validation rules
interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
}

// Simplified props
interface DataTableProps {
  resource: string
  columns: Column[]
  filters?: Filter[]
  pagination?: boolean
  allowCreate?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  formValidationRules?: Record<string, ValidationRule>
}

export default function DataTable({
  resource,
  columns,
  filters = [],
  pagination = true,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  formValidationRules = {},
}: DataTableProps) {
  const { config, currentUser } = useApp()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sort, setSort] = useState({ field: "id", order: "asc" as "asc" | "desc" })
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Reference data for dropdowns
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({})

  // Check permissions
  const checkPermission = (action: string): boolean => {
    if (!config || !currentUser) return false

    const resourceConfig = config.resources[resource]
    if (!resourceConfig) return false

    const permissions = resourceConfig.permissions[currentUser.role]
    if (!permissions) return false

    return permissions.includes(action) || permissions.includes("*")
  }

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)

      // Prepare filter object
      const filter = { ...filterValues }

      // Add search query if provided
      if (searchQuery) {
        // Simple implementation: search across all text fields
        const searchableFields = columns.filter((col) => ["text", "select"].includes(col.type)).map((col) => col.field)

        if (searchableFields.length > 0) {
          // This is a simplified approach - in a real app, you'd implement proper search
          searchableFields.forEach((field) => {
            filter[field] = searchQuery
          })
        }
      }

      const result = await mockApi.getList(resource, {
        filter,
        sort,
        pagination: { page, perPage },
      })

      setData(result.data)
      setTotal(result.total ?? 0)

      // Load reference data for all reference columns
      const referencesToLoad = columns
        .filter((col) => col.type === "reference" && col.reference)
        .map((col) => col.reference!.resource)
        .filter((value, index, self) => self.indexOf(value) === index) // Unique values

      const refData: Record<string, any[]> = {}

      for (const refResource of referencesToLoad) {
        const refResult = await mockApi.getList(refResource)
        refData[refResource] = refResult.data
      }

      setReferenceData(refData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, page, perPage, JSON.stringify(sort), JSON.stringify(filterValues), searchQuery])

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    //print form values
    console.log(formValues)
    columns.forEach((column) => {
      const value = formValues[column.field]
      let rules: ValidationRule
      // check if form valudation rules are defined and then apply them
      if (formValidationRules) {
        rules = formValidationRules[column.field]
      } 
      else {
        rules = {
          required: false,
          minLength: 0,
          maxLength: 0,
          pattern: "",
        }
      }
      if (rules?.required && (value === undefined || value === null || value === "")) {
        errors[column.field] = `${column.label} is required`
      }

      if (value && rules?.minLength && typeof value === "string" && value.length < rules.minLength) {
        errors[column.field] = `${column.label} must be at least ${rules.minLength} characters`
      }

      if (value && rules?.maxLength && typeof value === "string" && value.length > rules.maxLength) {
        errors[column.field] = `${column.label} must be at most ${rules.maxLength} characters`
      }

      if (value && rules?.pattern && typeof value === "string") {
        const regex = new RegExp(rules.pattern)
        if (!regex.test(value)) {
          errors[column.field] = `${column.label} has an invalid format`
        }
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle create
  const handleCreate = async () => {
    if (!validateForm()) return

    try {
      setFormSubmitting(true)
      await mockApi.create(resource, formValues)
      setIsCreateDialogOpen(false)
      setFormValues({})
      loadData()
    } catch (err) {
      console.error("Error creating item:", err)
      setFormErrors({ _form: "Failed to create item" })
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = async () => {
    if (!validateForm()) return

    try {
      setFormSubmitting(true)
      await mockApi.update(resource, currentItem.id, formValues)
      setIsEditDialogOpen(false)
      setCurrentItem(null)
      setFormValues({})
      loadData()
    } catch (err) {
      console.error("Error updating item:", err)
      setFormErrors({ _form: "Failed to update item" })
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      setFormSubmitting(true)
      await mockApi.delete(resource, currentItem.id)
      setIsDeleteDialogOpen(false)
      setCurrentItem(null)
      loadData()
    } catch (err) {
      console.error("Error deleting item:", err)
      setError("Failed to delete item")
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (item: any) => {
    setCurrentItem(item)
    setFormValues({ ...item })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (item: any) => {
    setCurrentItem(item)
    setIsDeleteDialogOpen(true)
  }

  // Render cell value based on column type
  const renderCellValue = (item: any, column: Column) => {
    const value = item[column.field]

    if (value === undefined || value === null) {
      return "-"
    }

    switch (column.type) {
      case "boolean":
        return value ? "Yes" : "No"
      case "date":
        return new Date(value).toLocaleDateString()
      case "reference":
        if (column.reference) {
          const refResource = column.reference.resource
          const refField = column.reference.displayField
          const refFieldId = column.reference.valueField
          const refItem = referenceData[refResource]?.find((ref) => ref[refFieldId] === value)
          return refItem ? refItem[refField] : value
        }
        return value
      case "select":
        if (column.options) {
          if (typeof column.options[0] === "string") {
            return value
          } else {
            const option = (column.options as { label: string; value: string }[]).find((opt) => opt.value === value)
            return option ? option.label : value
          }
        }
        return value
      default:
        return value
    }
  }

  // Render form field based on column type
  const renderFormField = (column: Column) => {
    const value = formValues[column.field]
    const error = formErrors[column.field]

    switch (column.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={column.field}
              checked={value === true}
              onCheckedChange={(checked) => handleInputChange(column.field, checked)}
            />
            <Label htmlFor={column.field}>{column.label}</Label>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={column.field}>{column.label}</Label>
            <Select value={value || "placeholder"} onValueChange={(val) => handleInputChange(column.field, val)}>
              <SelectTrigger id={column.field}>
                <SelectValue placeholder={`Select ${column.label}`} />
              </SelectTrigger>
              <SelectContent>
                {/* Add a placeholder item with a non-empty value */}
                <SelectItem value="placeholder" disabled>
                  Select {column.label}
                </SelectItem>
                {column.options &&
                  column.options.map((option, i) => {
                    if (typeof option === "string") {
                      // Ensure no empty string values
                      const optionValue = option || `option-${i}`
                      return (
                        <SelectItem key={i} value={optionValue}>
                          {option || "Unnamed option"}
                        </SelectItem>
                      )
                    } else {
                      // Ensure no empty string values
                      const optionValue = option.value || `option-${i}`
                      return (
                        <SelectItem key={i} value={optionValue}>
                          {option.label || "Unnamed option"}
                        </SelectItem>
                      )
                    }
                  })}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "reference":
        if (column.reference) {
          const refResource = column.reference.resource
          const refField = column.reference.displayField
          const valueField = column.reference.valueField
          const options = referenceData[refResource] || []
          return (
            <div className="space-y-2">
              <Label htmlFor={column.field}>{column.label}</Label>
              <Select value={value || "placeholder"} onValueChange={(val) => handleInputChange(column.field, val)}>
                <SelectTrigger id={column.field}>
                  <SelectValue placeholder={`Select ${column.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {/* Add a placeholder item with a non-empty value */}
                  <SelectItem value="placeholder" disabled>
                    Select {column.label}
                  </SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option[valueField]} value={option[valueField] || `option-${option[valueField]}`}>
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
            <Label htmlFor={column.field}>{column.label}</Label>
            <Input
              id={column.field}
              type="date"
              value={value || ""}
              onChange={(e) => handleInputChange(column.field, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={column.field}>{column.label}</Label>
            <Input
              id={column.field}
              type="number"
              value={value || ""}
              onChange={(e) => handleInputChange(column.field, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={column.field}>{column.label}</Label>
            <Input
              id={column.field}
              type="text"
              value={value || ""}
              onChange={(e) => handleInputChange(column.field, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resource}</CardTitle>
        <CardDescription>
          {total} {total === 1 ? "item" : "items"} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* filters , skip them if the filter is null or emtpy arrat, add code to only run the filter if the filter is defined */}
          {filters && filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <div key={filter.field} className="w-auto">
                  {filter.type === "select" ? (
                    <Select
                      value={filterValues[filter.field] || "placeholder"}
                      onValueChange={(value) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [filter.field]: value === "placeholder" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">All {filter.label}</SelectItem>
                        {filter.options?.map((option, index) => (
                          <SelectItem key={index} value={option || `option-${index}`}>
                            {option || "Unnamed option"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={filter.label}
                      value={filterValues[filter.field] || ""}
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.field]: e.target.value }))}
                      className="w-[150px]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {allowCreate && checkPermission("create") && (
            <Button
              onClick={() => {
                setFormValues({})
                setFormErrors({})
                setIsCreateDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">No data found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.field}>
                      <Button
                        variant="ghost"
                        className="p-0 font-medium"
                        onClick={() => {
                          if (sort.field === column.field) {
                            setSort({
                              field: column.field,
                              order: sort.order === "asc" ? "desc" : "asc",
                            })
                          } else {
                            setSort({
                              field: column.field,
                              order: "asc",
                            })
                          }
                        }}
                      >
                        {column.label}
                        {sort.field === column.field && (
                          <span className="ml-1">{sort.order === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Button>
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell key={`${item.id}-${column.field}`}>{renderCellValue(item, column)}</TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {allowEdit && checkPermission("update") && (
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>Edit</DropdownMenuItem>
                          )}
                          {allowDelete && checkPermission("delete") && (
                            <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      {pagination && (
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, total)} of {total}{" "}
            entries
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page * perPage >= total}>
              Next
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {resource}</DialogTitle>
            <DialogDescription>Fill in the details to create a new item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns
              .filter((column) => column.field !== "id")
              .map((column) => (
                <div key={column.field}>{renderFormField(column)}</div>
              ))}
            {formErrors._form && <p className="text-sm text-destructive">{formErrors._form}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {resource}</DialogTitle>
            <DialogDescription>Update the details of this item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns
              .filter((column) => column.field !== "id")
              .map((column) => (
                <div key={column.field}>{renderFormField(column)}</div>
              ))}
            {formErrors._form && <p className="text-sm text-destructive">{formErrors._form}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {resource}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
