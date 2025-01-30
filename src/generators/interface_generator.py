import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from models.base_models import ApplicationInterface
from typing import List, Optional, Union, Literal, Dict, Any

load_dotenv() 

def generate_interface(domain_model: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate application interface including pages and views based on the app use cases and entities.
    """
    model = outlines.models.openai(
        os.getenv("MODEL_NAME"),
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    generator = outlines.generate.json(
        model, 
        ApplicationInterface
    )
    
    pages_info = """
    ### Supported Pages, you can create these three types of pages, there can be only one dashboard page but you can have multiple resource pages and custom pages based on the use cases:
    1. **Dashboard Page**: A page to display metrics and charts.
       - Zones: Each dashboard can have multiple zones, each with a layout (columns, spacing) and components.
       - Components: Card, Chart, Table, Button.
    2. **Resource Page**: A CRUD interface for managing resources.
       - Includes four views: List, View, Edit, Create.
       - Components: Table, Form, Button.
    3. **Custom Page**: A flexible page for any other functionality.
       - Similar structure to Dashboard Page, but with custom content.
       - Components: Card, Chart, Table, Button, Modal, Form.
    """

    components_info = """
    ### Supported Components that you can use in the pages:
    - **Card**: Displays key metrics using aggregate function.
      - Props: 
        - `title`: Display title for the card
        - `provider`: Data provider name (must be a table or view name)
        - `column`: Column name to aggregate
        - `operation`: Aggregation operation (maps to dataProvider.aggregate)
          - `sum`: Sum of column values
          - `count`: Count of records
          - `avg`: Average of column values
          - `max`: Maximum value
          - `min`: Minimum value
        - `icon`: Optional icon name
        - `color`: Background color (hex code)
      - Example: `{ "type": "card", "name": "TotalExpenses", "provider": "expenses", "title": "Total Expenses", "column": "amount", "operation": "sum", "icon": "attach_money", "color": "#4caf50" }`
    
    - **Chart**: Displays data visualization (uses dataProvider.getAll).
      - Props: 
        - `provider`: Data provider name (must be a table or view name)
        - `chart_type`: "line", "bar", "pie"
        - `config`: Chart configuration
          - `x`: X-axis field name
          - `y`: Y-axis field name
        - `size`: Chart dimensions
      - Example: `{ "type": "chart", "name": "MonthlyTrend", "provider": "monthly_expenses", "chart_type": "line", "config": { "x": "month", "y": "total_expenses" } }`
    
    - **Table**: Displays paginated data (uses dataProvider.getList).
      - Props: 
        - `provider`: Data provider name (must be a table or view name)
        - `cols`: Column definitions
        - `actions`: Available actions ("edit", "delete", "view")
        - `pagination`: Page size and current page
        - `sort`: Sort field and order
      - Example: `{ "type": "table", "name": "ExpensesList", "provider": "expenses", "cols": [{"field": "amount", "header": "Amount"}], "actions": ["edit", "delete"] }`
    
    - **Form**: Captures user input (uses dataProvider.create or dataProvider.update).
      - Props: 
        - `provider`: Data provider name (must be a table or view name)
        - `fields`: Form field definitions
          - if the field is a select field and the options are dynamic, then the field should be defined as a select field and the options should be defined in the options field
          - Example1 provider/dynamic version : `{ "field": "category_id", "type": "select", "select_type": "dynamic","provider": "categories", "label_field": "name", "value_field": "id" }`
          - Example2 json /static version : `{ "field": "category_id", "type": "select", "select_type": "static", "select_options": [{"id": "1", "name": "Category 1", "value": "1"}, {"id": "2", "name": "Category 2", "value": "2"}] }`
        - `submit`: Action type ("create" or "update")
      - Example: `{ "type": "form", "name": "ExpenseForm", "provider": "expenses", "fields": [{"field": "amount", "type": "number"}], "submit": "create" }`
    
    - **Button**: Triggers actions.
      - Props: 
        - `label`: Button text
        - `action`: Action configuration
          - `type`: "nav" (navigation) or "modal" (open modal)
          - `url`: Target URL for navigation
        - `variant`: "contained", "outlined", "text"
      - Example: `{ "type": "button", "name": "AddExpense", "label": "Add Expense", "action": { "type": "nav", "url": "/expenses/new" } }`
    
    - **Table**: Displays tabular data with optional actions.
      - Props: `provider`, `cols`, `actions`.
      - Example: `{ "type": "table", "name": "JobsList", "provider": "jobs", "cols": [{"field": "title", "header": "Job Title"}], "actions": ["edit", "delete"] }`
    - **Button**: Triggers navigation or modal actions.
      - Props: `label`, `action`, `variant`.
      - Example: `{ "type": "btn", "name": "AddJob", "label": "Add Job", "action": { "type": "nav", "url": "/jobs/new" }, "variant": "contained" }`
    - **Modal**: Displays nested components.
      - Props: `modal`, `title`, `content`.
      - Example: `{ "type": "modal", "name": "EditModal", "modal": "editJob", "title": "Edit Job", "content": [{"type": "form", "name": "EditForm", "fields": [{"field": "title", "type": "text", "required": true}], "provider": "jobs", "submit": "update"}] }`
    - **Form**: Captures user input.
      - Props: `fields`, `submit`(create or update), `provider`.
      - Example: `{ "type": "form", "name": "JobForm", "fields": [{"field": "title", "type": "text", "required": true}], "submit": "create", "provider": "jobs" }`
    Things to note:
    - When deciding the data provider for a component
        - Provider names can be either table or view table names , as the data is fetched using the provider name giving any other name will break the code
        - Ensure that the provider is mapped to a base table or a view. When mapping to base table the name of table and provider should be same
        - If the data for a component can't be fetched from base tables, you can create views for that provider, then the tables view name should be the same as the provider name, and the columns should be the same as the columns in the provider or how the components are defined
    """

    structure_info = """
    ### Output Structure:
    1. AppSpecification:
       - `title`: App name
       - `intro`: Brief description
       - `use_cases`: List of use cases (name, description)
       - `pages`: List of pages
       - `views`: Optional view definitions

    2. Page Structure:
       - Dashboard and Custom Pages:
         - `type`: "dashboard" or "custom"
         - `name`: Page name
         - `desc`: Optional description
         - `zones`: List of zones with components
       - Resource Pages which is react-admin's resource page:
         - `type`: "resource"
         - `name`: Page name
         - `resource`: Resource name
         - `provider`: Provider name
         - `list_cols`: List columns
         - `list_actions`: List actions, only edit and delete are supported which will be used to edit and delete the record shown in the table
         - `create_fields`: Create form fields
         - `edit_fields`: Edit form fields
         - `view_fields`: View fields
         For both create and edit fields, if the field is a select field and the options are dynamic, then the field should be defined as a select field and the options should be defined in the options field
          - Example1 provider/dynamic version : `{ "field": "category_id", "type": "select", "select_type": "dynamic","provider": "categories", "label_field": "name", "value_field": "id" }`
          - Example2 json /static version : `{ "field": "category_id", "type": "select", "select_type": "static", "select_options": [{"id": "1", "name": "Category 1", "value": "1"}, {"id": "2", "name": "Category 2", "value": "2"}] }`

    """
    view_info = """
    ### Database View Guidelines:
    1. **View Names**: Use snake_case, descriptive names (e.g., monthly_expenses, category_totals)
    2. **Column References**: Always use the full column name with table alias
       - Correct: `e.created_at`, `c.name`
       - Incorrect: `date`, `name`
    3. **Table References**: Use the table name passed in the Entitie
       - Correct: `expenses`, `categories`
       - pass it in source_tables as a list of strings
    4. **Date Functions**: Use PostgreSQL standard functions
       - Use: `DATE_TRUNC('month', e.created_at)`
       - Don't use: `DATE_FORMAT`, `MONTH()`, or other non-PostgreSQL functions
    5. **Aggregations**: Always include proper GROUP BY clauses
    6. **Joins**: Use explicit JOIN syntax with proper conditions
    7. **Filters**: Use explicit filters with proper conditions
   
    
    Example View Definition:
    {
      "view_name": "monthly_expenses",
      "description": "Aggregates total expenses per month",
      "source_tables": ["expenses e"],
      "columns": [
        {
          "name": "month",
          "transformation": "DATE_TRUNC('month', e.created_at)"
        },
        {
          "name": "total_expenses",
          "transformation": "SUM(e.amount)"
        }
      ],
      "filters": "e.created_at IS NOT NULL",
      "group_by": ["DATE_TRUNC('month', e.created_at)"]
    }
        {
      "view_name": "category_expenses",
      "description": "Aggregates total expenses by category",
      "source_tables": ["expenses e", "categories c"],
      "columns": [
        {
          "name": "category_name",
          "transformation": "c.name"
        },
        {
          "name": "total_expenses",
          "transformation": "SUM(e.amount)"
        }
      ],
      "join_condition": "e.category_id = c.id",
      "group_by": ["c.name"]
    }
    """
    example_output = """
    ### Example Output Structure:
    {
      "title": "Expense Tracker",
      "intro": "Track and manage expenses effectively",
      "use_cases": [
        {
          "name": "Track Monthly Spending",
          "description": "Monitor expenses by month and category"
        }
      ],
      "pages": [
        {
          "type": "dashboard",
          "name": "Dashboard",
          "desc": "Overview of expenses",
          "zones": [
            {
              "name": "Summary",
              "layout": { "columns": 12, "spacing": 2 },
              "components": [
                {
                  "type": "card",
                  "name": "TotalExpenses",
                  "provider": "expenses",
                  "title": "Total Expenses",
                  "column": "amount",
                  "operation": "sum(amount)",
                  "color": "#4caf50"
                },
                {
                  "type": "chart",
                  "name": "MonthlyTrend",
                  "provider": "monthly_expenses",
                  "chart_type": "line",
                  "config": { 
                    "x": "month", 
                    "y": "total_expenses",
                    "title": "Monthly Expenses Trend"
                  }
                }
              ]
            }
          ]
        }
      ],
      "views": [
        {
          "view_name": "monthly_expenses",
          "description": "Aggregates total expenses per month",
          "source_tables": ["expenses e"],
          "columns": [
            {
              "name": "month",
              "transformation": "DATE_TRUNC('month', e.created_at)"
            },
            {
              "name": "total_expenses",
              "transformation": "SUM(e.amount)"
            }
          ],
          "filters": "e.created_at IS NOT NULL",
          "group_by": ["DATE_TRUNC('month', e.created_at)"]
        }
      ]
    }
    """

    # Helper function to get column value by header name
    def get_value_by_header(headers, row, header_name):
        try:
            index = headers.index(header_name)
            return row[index]
        except (ValueError, IndexError):
            return None

    # Format entities section - now handling dictionary
    entities_text = []
    for entity in domain_model.get('entities', []):
        name = entity['name']  # Dictionary access
        description = entity['description']
        
        # Format columns
        columns = []
        for row in entity['columns']['rows']:
            column_name = get_value_by_header(entity['columns']['headers'], row, 'name')
            data_type = get_value_by_header(entity['columns']['headers'], row, 'data_type')
            is_primary = get_value_by_header(entity['columns']['headers'], row, 'is_primary')
            is_nullable = get_value_by_header(entity['columns']['headers'], row, 'is_nullable')
            is_unique = get_value_by_header(entity['columns']['headers'], row, 'is_unique')
            if column_name and data_type:
                columns.append(f"{column_name} ({data_type})")
        
        # Format relationships
        relationships = []
        if 'relationships' in entity and 'rows' in entity['relationships']:
            for row in entity['relationships']['rows']:
                related_entity = row[0]
                rel_type = row[1]
                relationships.append(f"{rel_type} {related_entity}")
        
        entity_text = f"""
        Entity: {name}
        Description: {description}
        Columns: {', '.join(columns)}
        Relationships: {', '.join(relationships) if relationships else 'None'}
        """
        entities_text.append(entity_text)

    # Format use cases - now handling dictionaries
    use_cases_text = []
    for uc in domain_model.get('use_cases', []):
        use_cases_text.append(f"- {uc['name']}: {uc['description']}")  # Dictionary access instead of dot notation

    domain_description = f"""
    Application Domain Model:
    Title: {domain_model.get('title')}
    Description: {domain_model.get('description')}

    Use Cases:
    {chr(10).join(use_cases_text)}

    Base Tables:
    {chr(10).join(entities_text)}
    """

    prompt = f"""
    You are an expert UI/UX designer. Generate a complete interface specification based on the following use cases and base tables.
    Create an intuitive and user-friendly interface that addresses all use cases and manages all base tables effectively.

    {domain_description}

    {pages_info}

    {components_info}

    {view_info}

    {structure_info}

    {example_output}

    Generate a complete interface specification that:
    1. Creates All the appropriate pages for all use cases
    2. Includes All the necessary components for data visualization and management
    3. For all the providers mentioned in components follow following info and rules:
        - The providers are essentiall base table of view table names that are used by supabase to query data. 
        - The data provider for each component is mapped to a function in the dataProvider.js file
            - For card component, the provider is mapped to getAggragate, where provider,column,operation will be used to get the data for the card
            - For table component, the provider is mapped to getList, where provider will be used to get the data for the table
            - For form component, the provider is mapped to either create or update, where provider will be used to submit the form data
            - For chart component, the provider is mapped to getAll, where provider will be used to get all the records of the provider table to get the data for the chart
            - If the provider data for that component can not be accessed from a base table and data provider functions, create views for that provider
        - If a particular data for a component can't be fetched from entities which are base tables, you can create views for that provider, then the tables view name should be the same as the provider name, and the columns should be the same as the columns in the provider or how the components are defined
        - ensure no provider is missed it should be mapped to either a base table or a view
        - do not create views for base tables, the entity table can already be queried directly
    4. Ensures a consistent and intuitive user experience
    5. While generating the views if there is a group clause ensure to use the correct reference of the table in the group by clause, the column used shoud be present in the table. You reference the column names present in a table from the entities data.
   """
    
    result = generator(prompt)
    return result.model_dump()

