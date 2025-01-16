from typing import List, Optional, Union, Literal, Dict, Any
from pydantic import BaseModel, ConfigDict, RootModel,Field,model_validator

# Part 1: Data and Use Case Models
#----------------------------------------

class UseCase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    description: str

class Column(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str
    data_type: Literal["string", "integer", "boolean", "float", "timestamp", "date", "text", "uuid"]
    is_primary: Optional[bool]
    is_unique: Optional[bool]
    is_nullable: Optional[bool]
    default: Optional[str]
    auto_increment: Optional[bool]
    is_foreign: Optional[bool]
    foreign_table: Optional[str]
    foreign_column: Optional[str]
    on_delete: Optional[Literal["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"]]
    on_update: Optional[Literal["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"]]

class Index(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str
    columns: List[str]
    is_unique: Optional[bool]
    is_full_text: Optional[bool]

class TableData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    headers: List[str]
    rows: List[List[Optional[Union[str, bool, int, float, None]]]]


class Entity(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str
    description: Optional[str]
    columns: TableData
    relationships: Optional[TableData]
    indexes: Optional[TableData]
    composite_primary_keys: Optional[List[str]]
    composite_unique_constraints: Optional[List[List[str]]]
    check_constraints: Optional[List[str]]
    partition_by: Optional[Literal["range", "hash"]]

class ProfileDataValue(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field_name: str
    value: Union[str, int, bool, float]

class ProfileData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    values: List[ProfileDataValue]

class MockUser(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    records: TableData

class MockDataValue(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    column_name: str
    value: Union[str, int, bool, float]

class MockDataRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    values: List[MockDataValue]

class MockData(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    entity_name: str
    records: Optional[TableData]
    dependencies: Optional[List[str]]

# First Parent Model: Application Domain Model
class ApplicationDomain(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str
    description: str
    use_cases: List[UseCase]
    entities: List[Entity]
    mock_users: List[MockUser]
    mock_data: List[MockData]

# Step-by-Step Domain Models
class UseCaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str
    description: str
    use_cases: List[UseCase]

class EntityModel(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str
    description: str
    entities: List[Entity]

class MockUserModel(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str
    description: str
    mock_users: List[MockUser]

class MockDataModel(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    title: str
    description: str
    mock_data: List[MockData]

# Part 2: UI/UX and View Models
#----------------------------------------
# Component Base Models
ComponentType = Literal["card", "chart", "datatable", "button", "modal", "form"]

class ChartConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    x: str
    y: str

class TableCol(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field: str
    header: str

class TableAction(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["edit", "delete"]
    modal: Optional[str]
    confirm: Optional[str]

class ButtonAction(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["nav", "modal"]
    url: Optional[str]
    modal: Optional[str]

class SelectOption(BaseModel):
    model_config = ConfigDict(extra="forbid")
    select_type: Literal["static", "dynamic"]
    select_options: Optional[Union[List[Dict[str, str]], Dict[str, str]]]  # For static options
    provider: Optional[str]  # For dynamic options (table/view name)
    value_field: Optional[str]   # DB column for value
    label_field: Optional[str]   # DB column for label

class FormField(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field: str
    type: str
    required: Optional[bool]
    options: Optional[List[SelectOption]]

class ViewField(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field: str
    type: str
    options: Optional[List[SelectOption]]

class FilterField(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    field: str
    type: str
    options: Optional[List[SelectOption]]

# Component Models
class CardComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["card"]
    name: str
    provider: str
    title: str
    column: Optional[str]
    operation: Optional[str]
    icon: Optional[str]
    color: Optional[str]

class ChartComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["chart"]
    name: str
    provider: str
    chart_type: Literal["bar", "line", "pie"]
    config: ChartConfig
    size: Optional[Dict[str, Union[int, str]]]

class TableComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["table"]
    name: str
    provider: str
    cols: List[TableCol]
    actions: List[Literal["edit", "delete"]]

class ButtonComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["btn"]
    name: str
    label: str
    action: ButtonAction
    variant: Optional[Literal["contained", "outlined", "text"]]

class FormComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["form"]
    name: str
    fields: List[FormField]
    submit: str

class ModalComponent(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["modal"]
    name: str
    modal: str
    content: List[Union[CardComponent, ChartComponent, TableComponent, ButtonComponent, FormComponent]]

class Zone(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    name: str
    layout: Optional[Dict[str, Union[int, str, Dict[str, Union[int, str]]]]]
    components: List[Union[CardComponent, ChartComponent, TableComponent, ButtonComponent, ModalComponent, FormComponent]]

# View Models
class ViewDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")
    view_name: str
    source_tables: List[str]
    columns: Optional[List[Dict[str, str]]]
    group_by: Optional[List[str]]
    filters: Optional[str]
    description: Optional[str]

# Page Models
class DashboardPage(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["dashboard"]
    name: str
    desc: Optional[str]
    zones: List[Zone]

class ResourcePage(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["resource"]
    name: str
    resource: str
    provider: str
    filters: Optional[List[FilterField]]
    create_fields: Optional[List[ViewField]]
    edit_fields: Optional[List[ViewField]]
    view_fields: Optional[List[ViewField]]
    list_fields: Optional[List[ViewField]]
    list_actions: Optional[List[Dict[str, Union[str, Dict[str, str]]]]]

class CustomPage(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    type: Literal["custom"]
    name: str
    desc: Optional[str]
    zones: List[Zone]



# Second Parent Model: Application Interface Model
class ApplicationInterface(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    pages: List[Union[DashboardPage, ResourcePage, CustomPage]]
    views: Optional[List[ViewDefinition]]
    
    