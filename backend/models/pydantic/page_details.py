from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List, Union, Dict

# === Common Types ===

class ReferenceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    resource: str = Field(..., description="Name of the referenced resource")
    displayField: str = Field(..., description="Field to display from the referenced resource")
    valueField: str = Field(..., description="Field to store the value from the referenced resource and the field that mapps to the parent key")

class OptionString(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    label: str = Field(..., description="Label to display")
    value: str = Field(..., description="Value to store")

OptionType = Union[str, OptionString]

# === Filter and Validation ===

class FilterSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)    
    field: str = Field(..., description="Field to filter on")
    label: str = Field(..., description="Label for the filter UI")
    type: Literal["text", "select", "date", "number"] = Field(..., description="Type of filter input",json_schema_extra={"type": "string"})
    options: Optional[List[str]] = Field(..., description="Optional list of options for select filters")

class ValidationRuleSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    required: Optional[bool] = Field(..., description="Field is required")
    minLength: Optional[int] = Field(..., description="Minimum string length")
    maxLength: Optional[int] = Field(..., description="Maximum string length")
    pattern: Optional[str] = Field(..., description="Regex pattern the input must match")

# === Components ===

class MetricCardProps(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["MetricCard"] = Field(..., description="Type of the component",json_schema_extra={"type": "string"})
    title: str = Field(..., description="Title of the metric card")
    resource: str = Field(..., description="Resource name to fetch data from")
    field: str = Field(..., description="Field name to aggregate")
    aggregate: Literal["sum", "avg", "count", "max", "min"] = Field(..., description="Aggregate operation")
    filter: Optional[Dict[str, Union[str, int, float, bool]]] = Field(..., description="Optional filter criteria")
    icon: Optional[str] = Field(..., description="Lucide icon name to show on the card")
    color: Optional[str] = Field(..., description="Color theme for the icon")

class ChartProps(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["Chart"] = Field(..., description="Type of the component",json_schema_extra={"type": "string"})
    title: Optional[str] = Field(..., description="Optional title of the chart")
    chartType: Literal["bar", "line", "pie", "area", "doughnut"] = Field(..., description="Type of chart")
    resource: str = Field(..., description="Resource name to fetch data from")
    xField: str = Field(..., description="X-axis field")
    yField: str = Field(..., description="Y-axis field")
    transform: Optional[Literal["sum", "avg", "count"]] = Field(..., description="Transformation on Y field")
    groupBy: Optional[str] = Field(..., description="Group data by this field")
    filter: Optional[Dict[str, Union[str, int, float, bool]]] = Field(..., description="Optional filter criteria")
    xFieldReference: Optional[ReferenceSchema] = Field(..., description="Reference info for xField if it references another resource")
    yFieldReference: Optional[ReferenceSchema] = Field(..., description="Reference info for yField if it references another resource")

class TableColumnSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field: str = Field(..., description="Field name for the column")
    label: str = Field(..., description="Label to display in the header")
    type: Literal["text", "number", "date", "boolean", "select", "reference"] = Field(..., description="Column type",json_schema_extra={"type": "string"})
    options: Optional[List[OptionType]] = Field(..., description="List of options for select fields")
    reference: Optional[ReferenceSchema] = Field(..., description="Reference info for foreign key column")

class DataTableProps(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["DataTable"] = Field(..., description="Type of the component",json_schema_extra={"type": "string"})
    resource: str = Field(..., description="Resource name for the table")
    columns: List[TableColumnSchema] = Field(..., description="Columns to render in the table")
    filters: Optional[List[FilterSchema]] = Field(..., description="Optional filters to apply")
    pagination: Optional[bool] = Field(..., description="Enable or disable pagination")
    allowCreate: Optional[bool] = Field(..., description="Allow creation of new entries")
    allowEdit: Optional[bool] = Field(..., description="Allow editing of rows")
    allowDelete: Optional[bool] = Field(..., description="Allow deleting of rows")
    formValidationRules: Optional[Dict[str, ValidationRuleSchema]] = Field(..., description="Validation rules per column")

class FormFieldSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str = Field(..., description="Name of the field")
    label: str = Field(..., description="Label to show in the form")
    type: Literal["text", "number", "date", "boolean", "select", "reference"] = Field(..., description="Type of the field",json_schema_extra={"type": "string"})
    required: Optional[bool] = Field(..., description="Is the field required")
    defaultValue: Optional[Union[str, int, float, bool]] = Field(..., description="Default value for the field")
    options: Optional[List[str]] = Field(..., description="Available options for select fields")
    reference: Optional[ReferenceSchema] = Field(..., description="Reference details if field is foreign key")

class SimpleFormProps(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["SimpleForm"] = Field(..., description="Type of the component",json_schema_extra={"type": "string"})
    resource: str = Field(..., description="Resource to fetch and submit data")
    submitAction: Literal["create", "update"] = Field(..., description="Whether form creates or updates")
    fields: List[FormFieldSchema] = Field(..., description="List of fields in the form")
    redirectPath: Optional[str] = Field(..., description="Path to redirect on success")

class WizardStepSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str = Field(..., description="Step title")
    fields: List[FormFieldSchema] = Field(..., description="Fields shown in this step")

class WizardFormProps(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["WizardForm"] = Field(..., description="Type of the component",json_schema_extra={"type": "string"})
    resource: str = Field(..., description="Resource to use for data operations")
    submitAction: Literal["create", "update"] = Field(..., description="Action type")
    steps: List[WizardStepSchema] = Field(..., description="Form steps")
    redirectPath: Optional[str] = Field(..., description="Path to go after submit")

# === Component Union ===

ComponentUnion = Union[
    MetricCardProps,
    ChartProps,
    DataTableProps,
    SimpleFormProps,
    WizardFormProps
]

# === Page Detail ===

class PageZoneSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str = Field(..., description="Zone name like header, body, footer")
    components: List[ComponentUnion] = Field(..., description="List of components to show in the zone")

class PageDetailSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    id: str = Field(..., description="ID of the page this detail belongs to")
    zones: List[PageZoneSchema] = Field(..., description="List of layout zones with components")
