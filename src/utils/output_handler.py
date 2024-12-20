import json
import os
import shutil
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from ..models.base_models import Entity, MockData, MockUser
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from urllib.parse import urlparse
import logging

class CodeGenerator:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.components_dir = output_dir / "frontend/src/components"
        self.pages_dir = output_dir / "frontend/src/pages"
        self.frontend_dir = output_dir / "frontend"
        self.sql_dir = output_dir / "sql"
        
        # Setup Jinja environment
        template_dir = Path(__file__).parent.parent / "templates"
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def render_template(self, template_name: str, context: Dict[str, Any], output_path: Path):
        """Render a Jinja template with given context."""
        template = self.env.get_template(template_name)
        output = template.render(context)
        with open(output_path, "w", encoding='utf-8') as file:
            file.write(output)

    def generate_code(self, interface_model: Dict[str, Any]):
        """Generate all application code."""
        # Generate pages
        for page in interface_model["pages"]:
            page_type = page["type"]
            page_name = page["name"].replace(" ", "")

            if page_type in ["dashboard", "custom"]:
                self.render_template(
                    "dashboard_or_custom.jinja2",
                    {"page": page},
                    self.pages_dir / f"{page_name}.jsx"
                )
            elif page_type == "resource":
                resource_context = {"resource": page}
                self.render_template(
                    "resource_list.jinja2",
                    resource_context,
                    self.pages_dir / f"{page_name}List.jsx"
                )
                self.render_template(
                    "resource_view.jinja2",
                    resource_context,
                    self.pages_dir / f"{page_name}View.jsx"
                )
                self.render_template(
                    "resource_edit.jinja2",
                    resource_context,
                    self.pages_dir / f"{page_name}Edit.jsx"
                )
                self.render_template(
                    "resource_create.jinja2",
                    resource_context,
                    self.pages_dir / f"{page_name}Create.jsx"
                )

        # Generate layout.js
        self.render_template("layout.jinja2", {"pages": interface_model["pages"]}, self.frontend_dir / "src/layout.js")

        # Generate App.js
        app_context = {
            "pages": [p for p in interface_model["pages"] if p["type"] == "custom"],
            "resources": [p for p in interface_model["pages"] if p["type"] == "resource"]
        }
        self.render_template("app.jinja2", app_context, self.frontend_dir / "src/App.js")

class ProjectSetup:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.frontend_dir = output_dir / "frontend"
        load_dotenv()
        
        # Get schema prefix from directory name - add 'app_' prefix to ensure valid SQL identifier
        self.schema_prefix = f"app_{output_dir.name.replace('-', '_')}"
        
        # Supabase connection details
        self.supabase_url = os.getenv("SUPABASE_PROJECT_URL")
        self.supabase_password = os.getenv("SUPABASE_DB_PASSWORD")
        self.db_host = os.getenv("SUPABASE_HOST")
        self.db_name = os.getenv("SUPABASE_DATABASE")
        self.db_user = os.getenv("SUPABASE_USER")
        self.db_port = os.getenv("SUPABASE_PORT")

    def get_db_connection(self):
        """Create and return a database connection"""
        try:
            conn = psycopg2.connect(
                dbname=self.db_name,
                user=self.db_user,
                password=self.supabase_password,
                host=self.db_host,
                port=self.db_port,
                sslmode='require'  # Required for Supabase
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            return conn
        except Exception as e:
            print(f"Error connecting to database: {e}")
            raise

    async def setup_database(self, domain_model: Dict[str, Any]):
        """Setup database using psycopg2"""
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()

            try:
                # Save schema prefix
                with open(self.output_dir / "prefix.txt", "w") as f:
                    f.write(self.schema_prefix)

                # Run SQL scripts in order
                sql_dir = self.output_dir / "sql"
                for sql_file in sorted(sql_dir.glob("*.sql")):
                    print(f"Executing {sql_file.name}...")
                    with open(sql_file) as f:
                        sql = f.read()
                        cur.execute(sql)
                    print(f"Completed {sql_file.name}")

                # Insert mock data
                generate_mock_data_sql(
                    domain_model.get('mock_data', []),
                    domain_model.get('mock_users', []),
                    self.schema_prefix,
                    conn
                )

                project_data = {
                    'url': self.supabase_url,
                    'anon_key': os.getenv("SUPABASE_ANON_KEY"),
                    'prefix': self.schema_prefix
                }

                print(f"\nSupabase project created: {project_data['url']}")

                return project_data

            finally:
                cur.close()
                conn.close()

        except Exception as e:
            print(f"\nError during database setup: {str(e)}")
            print("Database setup completed with errors. Please check the logs.")
            return {
                'url': self.supabase_url,
                'anon_key': os.getenv("SUPABASE_ANON_KEY"),
                'prefix': self.schema_prefix
            }

    async def create_views(self, domain_model: Dict[str, Any]):
        """Create database views using psycopg2"""
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()

            try:
                schema_name = domain_model.get('schema', 'public')

                for view in domain_model.get('views', []):
                    # Build view definition
                    columns = [
                        f"{col.get('transformation', col['name'])} as {col['name']}"
                        for col in view.columns
                    ]
                    
                    from_clause = ", ".join(view.source_tables)
                    where_clause = f"WHERE {view.filters}" if view.filters else ""
                    group_by = (f"GROUP BY {', '.join(view.group_by)}" 
                              if view.group_by else "")

                    view_sql = f"""
                    CREATE OR REPLACE VIEW {schema_name}.{view.view_name} AS
                    SELECT {', '.join(columns)}
                    FROM {from_clause}
                    {where_clause}
                    {group_by};
                    
                    -- Grant permissions
                    GRANT SELECT ON {schema_name}.{view.view_name} TO authenticated;
                    GRANT SELECT ON {schema_name}.{view.view_name} TO anon;
                    """

                    cur.execute(view_sql)
                    print(f"Created view: {view.view_name}")

            finally:
                cur.close()
                conn.close()

        except Exception as e:
            print(f"Error creating views: {e}")
            raise

    async def create_tables(self, domain_model: Dict[str, Any]):
        """Create tables using psycopg2"""
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()

            try:
                schema_name = domain_model.get('schema', 'public')

                # Create profiles table first
                profiles_table_sql = f"""
                CREATE TABLE IF NOT EXISTS {schema_name}.{self.schema_prefix}_profiles (
                    id UUID PRIMARY KEY REFERENCES auth.users(id),
                    email TEXT NOT NULL UNIQUE,
                    full_name TEXT,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Grant permissions
                GRANT ALL ON {schema_name}.{self.schema_prefix}_profiles TO authenticated;
                GRANT SELECT ON {schema_name}.{self.schema_prefix}_profiles TO anon;

                -- Create trigger for updated_at
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';

                DROP TRIGGER IF EXISTS update_profiles_updated_at ON {schema_name}.{self.schema_prefix}_profiles;
                CREATE TRIGGER update_profiles_updated_at
                    BEFORE UPDATE ON {schema_name}.{self.schema_prefix}_profiles
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                """
                cur.execute(profiles_table_sql)
                print(f"Created profiles table: {self.schema_prefix}_profiles")

                # Then create all other tables
                for entity in domain_model.get('entities', []):
                    # Count how many columns are marked as primary
                    primary_count = sum(1 for col in entity.columns if col.is_primary)

                    # Generate table creation SQL
                    columns = []
                    for col in entity.columns:
                        col_def = [
                            col.name,
                            self._map_data_type(col.data_type)
                        ]
                        
                        # Only add PRIMARY KEY if there's a single primary key
                        # or if there are multiple but this is the 'id' column
                        if col.is_primary and (primary_count == 1 or col.name == 'id'):
                            col_def.append("PRIMARY KEY")
                        if col.is_unique:
                            col_def.append("UNIQUE")
                        if not col.is_nullable:
                            col_def.append("NOT NULL")
                        if col.default:
                            col_def.append(f"DEFAULT {col.default}")
                            
                        columns.append(" ".join(col_def))

                    create_table_sql = f"""
                    CREATE TABLE IF NOT EXISTS {schema_name}.{entity.name} (
                        {','.join(columns)}
                    );
                    
                    -- Grant permissions
                    GRANT ALL ON {schema_name}.{entity.name} TO authenticated;
                    GRANT SELECT ON {schema_name}.{entity.name} TO anon;
                    """

                    cur.execute(create_table_sql)
                    print(f"Created table: {entity.name}")

                    # Create indexes
                    if entity.indexes:
                        for idx in entity.indexes:
                            index_sql = f"""
                            CREATE {' UNIQUE ' if idx.is_unique else ' '}
                            INDEX IF NOT EXISTS {idx.name}
                            ON {schema_name}.{entity.name} ({','.join(idx.columns)});
                            """
                            cur.execute(index_sql)
                            print(f"Created index: {idx.name}")

            finally:
                cur.close()
                conn.close()

        except Exception as e:
            print(f"Error creating tables: {e}")
            raise

    def _map_data_type(self, data_type: str) -> str:
        """Map model data types to PostgreSQL types"""
        type_mapping = {
            'string': 'TEXT',
            'integer': 'INTEGER',
            'boolean': 'BOOLEAN',
            'float': 'DOUBLE PRECISION',
            'timestamp': 'TIMESTAMP WITH TIME ZONE',
            'date': 'DATE',
            'text': 'TEXT',
            'uuid': 'UUID',
            'varchar': 'VARCHAR',
            'numeric': 'NUMERIC',
            'json': 'JSONB',
            'array': 'ARRAY',
            'binary': 'BYTEA'
        }
        return type_mapping.get(data_type.lower(), 'TEXT')

    def setup_frontend(self):
        """Setup React frontend project"""
        # Create frontend directory
        self.frontend_dir.mkdir(exist_ok=True)
        
        # Copy template directories
        template_dir = Path(__file__).parent.parent / "templates"
        
        # Copy src folder
        shutil.copytree(
            template_dir / "src",
            self.frontend_dir / "src",
            dirs_exist_ok=True
        )
        
        # Copy public folder
        shutil.copytree(
            template_dir / "public",
            self.frontend_dir / "public",
            dirs_exist_ok=True
        )
        # copy components folder
        shutil.copytree(
            template_dir / "components",
            self.frontend_dir / "src/components",
            dirs_exist_ok=True
        )
        
        # Copy providers
        providers_dir = self.frontend_dir / "src/providers"
        providers_dir.mkdir(exist_ok=True)
        for provider_file in (template_dir / "providers").glob("*.js"):
            shutil.copy2(provider_file, providers_dir)


        # Create package.json
        package_json = {
            "name": self.output_dir.name,
            "version": "0.1.0",
            "private": True,
            "dependencies": {
                "@emotion/react": "^11.14.0",
                "@emotion/styled": "^11.14.0",
                "@fontsource/inter": "^5.1.0",
                "@mui/icons-material": "^6.1.10",
                "@mui/material": "^6.1.10",
                "@supabase/supabase-js": "^2.47.2",
                "cra-template": "1.2.0",
                "react": "^19.0.0",
                "react-admin": "^5.4.1",
                "react-dom": "^19.0.0",
                "react-scripts": "5.0.1",
                "recharts": "^2.14.1",
                "react-router-dom": "^6.21.0",
                "@mui/x-data-grid": "^7.23.2"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            },
            "eslintConfig": {
                "extends": ["react-app"]
            },
            "browserslist": {
                "production": [">0.2%", "not dead", "not op_mini all"],
                "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
            }
        }
        
        with open(self.frontend_dir / "package.json", "w") as f:
            json.dump(package_json, f, indent=2)
    
    async def setup_run_sql_function(self):
        """Create the run_sql function in Supabase"""
        create_function_sql = """
        DO $$
        BEGIN
            -- Check if the function exists
            IF NOT EXISTS (
                SELECT 1
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.proname = 'run_sql' AND n.nspname = 'public'
            ) THEN
                -- Create the function if it does not exist
                CREATE OR REPLACE FUNCTION public.run_sql(query TEXT)
                RETURNS VOID AS $$
                BEGIN
                    EXECUTE query;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
                
                -- Grant necessary permissions
                GRANT EXECUTE ON FUNCTION public.run_sql(text) TO authenticated;
                GRANT EXECUTE ON FUNCTION public.run_sql(text) TO service_role;
            END IF;
        END $$;
        """
        
        try:
            # Execute raw SQL to create function using the SQL API
            data = await self.supabase.table('_sql').select('*').execute()
            await self.supabase.query(create_function_sql).execute()
            print("run_sql function created successfully")
            return True
        except Exception as e:
            print(f"Error creating run_sql function: {e}")
            return False

    async def execute_sql(self, sql: str):
        """Execute SQL using run_sql function"""
        try:
            await self.supabase.postgrest.rpc('run_sql', {'query': sql}).execute()
            return True
        except Exception as e:
            print(f"Error executing SQL: {e}")
            return False

    def install_dependencies(self):
        """Install npm dependencies"""
        try:
            # Check if npm is available
            npm_path = shutil.which('npm')
            if not npm_path:
                print("\nWarning: npm not found in PATH. Please install Node.js and npm.")
                print(f"You'll need to run 'npm install' manually in: {self.frontend_dir}")
                return False

            # Check if directory exists
            if not self.frontend_dir.exists():
                print(f"\nError: Frontend directory not found at: {self.frontend_dir}")
                return False

            print(f"\nInstalling dependencies in: {self.frontend_dir}")
            original_dir = os.getcwd()
            print(f"Original directory: {original_dir} | Frontend directory: {self.frontend_dir}")
            os.chdir(str(self.frontend_dir))
            print(f"Current directory: {os.getcwd()} | should be frontend directory {self.frontend_dir}")
            # Run npm install
            result = subprocess.run(
                "npm install",
                check=False,
                shell=True,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print(f"\nError running npm install: {result.stderr}")
                print(f"Please run 'npm install' manually in: {self.frontend_dir}")
                return False

            print("\nDependencies installed successfully")
            return True

        except Exception as e:
            print(f"\nError installing dependencies: {str(e)}")
            print(f"Please run 'npm install' manually in: {self.frontend_dir}")
            return False

def create_output_directory(base_dir: str = "output") -> Path:
    """Create a timestamped output directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(base_dir) / timestamp
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    (output_dir / "frontend/src/components").mkdir(parents=True, exist_ok=True)
    (output_dir / "frontend/src/pages").mkdir(parents=True, exist_ok=True)
    (output_dir / "sql").mkdir(parents=True, exist_ok=True)
    
    return output_dir

def save_domain_model(output_dir: Path, domain_model: Dict[str, Any]):
    """Save domain model and generate SQL schema."""
    # Save domain model as JSON
    with open(output_dir / "domain_model.json", "w") as f:
        json.dump(domain_model, f, indent=2)
    
    # Generate table prefix from directory name
    table_prefix = f"app_{output_dir.name.lower()}"
    
    # Create SQL directory
    sql_dir = output_dir / "sql"
    sql_dir.mkdir(exist_ok=True)
    
    # Save prefix for later use
    with open(output_dir / "prefix.txt", "w") as f:
        f.write(table_prefix)
    
    # Create profiles table first (using 00_ prefix to ensure it runs first)
    profiles_sql = f"""
    -- Create profiles table
    CREATE TABLE IF NOT EXISTS public.{table_prefix}_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Grant permissions
    GRANT ALL ON public.{table_prefix}_profiles TO authenticated;
    GRANT SELECT ON public.{table_prefix}_profiles TO anon;

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.{table_prefix}_profiles;
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.{table_prefix}_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """
    
    with open(sql_dir / "00_profiles.sql", "w") as f:
        f.write(profiles_sql)
    
    # Create dependency graph
    dependency_graph = {}
    table_dependencies = {}
    
    for entity in domain_model["entities"]:
        table_name = entity['name']
        dependencies = set()
        
        # Get index of foreign key related columns
        foreign_idx = entity['columns']['headers'].index('is_foreign')
        foreign_table_idx = entity['columns']['headers'].index('foreign_table')
        
        # Check each column for foreign keys
        for row in entity['columns']['rows']:
            if row and len(row) > foreign_idx:
                if row[foreign_idx]:
                    foreign_table = row[foreign_table_idx]
                    if foreign_table != 'auth.users':  # Skip external dependencies
                        dependencies.add(foreign_table)
        
        dependency_graph[table_name] = dependencies
        table_dependencies[table_name] = entity
    
    # Topological sort to order tables by dependencies
    def topological_sort():
        # Track visited nodes and detect cycles
        visited = set()
        temp_visited = set()
        order = []
        
        def visit(table):
            if table in temp_visited:
                raise ValueError(f"Circular dependency detected involving {table}")
            if table not in visited:
                temp_visited.add(table)
                for dep in dependency_graph[table]:
                    if dep in dependency_graph:  # Only visit if it's a managed table
                        visit(dep)
                temp_visited.remove(table)
                visited.add(table)
                order.append(table)
        
        for table in dependency_graph:
            if table not in visited:
                visit(table)
        
        return order
    
    try:
        # Get sorted table order
        table_order = topological_sort()
        
        # Generate SQL files in dependency order
        for i, table_name in enumerate(table_order):
            entity = table_dependencies[table_name]
            sql = generate_sql_schema(Entity(**entity), table_prefix)
            
            # Determine appropriate prefix based on dependencies
            if not dependency_graph[table_name]:
                prefix = "10"  # Base tables
            else:
                prefix = f"{20 + i}"  # Dependent tables in order
                
            with open(sql_dir / f"{prefix}_{table_name}.sql", "w") as f:
                f.write(sql)
    
    except ValueError as e:
        print(f"Error: {e}")
        raise
    
    # Generate README
    generate_readme(output_dir, domain_model)

def save_interface_model(output_dir: Path, interface_model: Dict[str, Any], domain_model: Dict[str, Any]):
    """Save interface model and generate frontend code."""
    # Get prefix
    with open(output_dir / "prefix.txt", "r") as f:
        prefix = f.read().strip()
    
    # Save interface model as JSON
    with open(output_dir / "interface_model.json", "w") as f:
        json.dump(interface_model, f, indent=2)
    
    # Generate SQL views (50_)
    sql_dir = output_dir / "sql"
    sql_dir.mkdir(exist_ok=True)
    
    # Remove any existing view files to prevent duplicates
    for existing_view in sql_dir.glob("50_*.sql"):
        existing_view.unlink()
    
    for i, view in enumerate(interface_model.get("views", [])):
        view_name = f"{view['view_name']}"
        sql = generate_view_sql(view, prefix)
        # Use a consistent naming pattern for view files
        with open(sql_dir / f"50_{i+1:02d}_{view_name}.sql", "w") as f:
            f.write(sql)
    
    # Create frontend .env file
    env_content = f"""
REACT_APP_SUPABASE_URL={os.getenv('SUPABASE_PROJECT_URL')}
REACT_APP_SUPABASE_ANON_KEY={os.getenv('SUPABASE_ANON_KEY')}
REACT_APP_TABLE_PREFIX={prefix}
"""
    with open(output_dir / "frontend/.env", "w") as f:
        f.write(env_content.strip())
    
    # Create instance of ProjectSetup
    project_setup = ProjectSetup(output_dir)
    
    # Setup frontend
    project_setup.setup_frontend()
    
    # Generate code using CodeGenerator
    generator = CodeGenerator(output_dir)
    generator.generate_code(interface_model)
    
    try:
        # Setup database with domain model for mock data
        project_data = asyncio.run(project_setup.setup_database(domain_model))
        
        # Install dependencies
        project_setup.install_dependencies()
        
        print(f"\nProject setup complete! To start the app:")
        print(f"cd {output_dir}/frontend")
        print("npm start")
        
    except Exception as e:
        print(f"\nError during project setup: {e}")
        print("Please check the logs and try manual setup if needed.")

def generate_view_sql(view: Dict[str, Any], prefix: str) -> str:
    """Generate SQL for creating a view."""
    view_name = f"{prefix}_{view['view_name']}"
    
    # Add prefix to table names in source_tables
    source_tables = []
    for table in view['source_tables']:
        # Split on JOIN if present
        parts = table.split('JOIN')
        prefixed_parts = []
        for part in parts:
            # Add prefix to each table reference
            words = part.strip().split(' ')
            # Replace table name with prefixed version, keep aliases
            words[0] = f" public.{prefix}_{words[0]} "
            prefixed_parts.append(' '.join(words))
        source_tables.append(' JOIN '.join(prefixed_parts))

    columns = [
        f"{col['transformation']} as {col['name']}"
        for col in view['columns']
    ]
    
    sql = f"""
    -- Auto-generated view for {view['description']}
    CREATE OR REPLACE VIEW public.{view_name} AS
    SELECT {', '.join(columns)}
    FROM {' '.join(source_tables)}"""

    if view.get('filters'):
        sql += f"\nWHERE {view['filters']}"
        
    if view.get('group_by'):
        sql += f"\nGROUP BY {', '.join(view['group_by'])}"

    sql += ";\n"
    
    # Add permissions
    sql += f"""
    -- Grant permissions
    GRANT SELECT ON public.{view_name} TO authenticated;
    GRANT SELECT ON public.{view_name} TO anon;
    """
    
    return sql

def generate_sql_schema(entity: Entity, prefix: str) -> str:
    """Generate SQL schema for an entity."""
    table_name = f"{prefix}_{entity.name}"
    
    # Get column index mappings first
    headers = entity.columns.headers
    name_idx = headers.index("name")
    type_idx = headers.index("data_type")
    primary_idx = headers.index("is_primary")
    nullable_idx = headers.index("is_nullable")
    unique_idx = headers.index("is_unique")
    foreign_idx = headers.index("is_foreign")
    foreign_table_idx = headers.index("foreign_table")
    foreign_column_idx = headers.index("foreign_column")
    default_idx = headers.index("default") if "default" in headers else None
    on_delete_idx = headers.index("on_delete") if "on_delete" in headers else None
    on_update_idx = headers.index("on_update") if "on_update" in headers else None
    auto_increment_idx = headers.index("auto_increment") if "auto_increment" in headers else None
    
    # Get list of column names for checking duplicates
    column_names = [row[name_idx] for row in entity.columns.rows]
    
    # Add default tracking columns only if they don't already exist
    default_columns = []
    if "created_at" not in column_names:
        default_columns.append("created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    if "updated_at" not in column_names:
        default_columns.append("updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")
    if "created_by" not in column_names:
        default_columns.append("created_by UUID DEFAULT auth.uid()")
    
    sql = f"CREATE TABLE IF NOT EXISTS public.{table_name} (\n"
    
    # Process existing columns
    columns = []
    for row in entity.columns.rows:
        col_def = []
        col_def.append(row[name_idx])
        
        postgres_type = {
            'integer': 'SERIAL' if row[auto_increment_idx] else 'INTEGER',
            'bigint': 'BIGSERIAL' if row[auto_increment_idx] else 'BIGINT',
            'boolean': 'BOOLEAN',
            'float': 'DOUBLE PRECISION',
            'decimal': 'DECIMAL',
            'numeric': 'NUMERIC',
            'timestamp': 'TIMESTAMP WITH TIME ZONE',
            'date': 'DATE',
            'time': 'TIME',
            'text': 'TEXT',
            'varchar': 'VARCHAR',
            'char': 'CHAR',
            'uuid': 'UUID',
            'json': 'JSONB',
            'array': 'ARRAY',
            'binary': 'BYTEA'
        }.get(row[type_idx].lower(), 'TEXT')
        
        col_def.append(postgres_type)
        
        if row[primary_idx]:
            col_def.append("PRIMARY KEY")
            if postgres_type == 'UUID':
                col_def.append("DEFAULT uuid_generate_v4()")
        if not row[nullable_idx]:
            col_def.append("NOT NULL")
        if row[unique_idx]:
            col_def.append("UNIQUE")
        if default_idx is not None and row[default_idx] and postgres_type != 'UUID':
            col_def.append(f"DEFAULT {row[default_idx]}")
            
        columns.append(" ".join(col_def))
        
        if row[foreign_idx]:
            # Special handling for auth.users references
            if row[foreign_table_idx] == 'auth.users':
                fk = f"FOREIGN KEY ({row[name_idx]}) REFERENCES auth.users({row[foreign_column_idx]})"
            else:
                fk = f"FOREIGN KEY ({row[name_idx]}) REFERENCES public.{prefix}_{row[foreign_table_idx]}({row[foreign_column_idx]})"
                
            if on_delete_idx is not None and row[on_delete_idx]:
                fk += f" ON DELETE {row[on_delete_idx]}"
            if on_update_idx is not None and row[on_update_idx]:
                fk += f" ON UPDATE {row[on_update_idx]}"
            columns.append(fk)
    
    # Add default columns only if they don't exist
    columns.extend(default_columns)
    
    sql += ",\n    ".join(columns)
    
    # Add composite primary keys if any
    if entity.composite_primary_keys:
        sql += f",\n    PRIMARY KEY ({', '.join(entity.composite_primary_keys)})"
    
    # Add composite unique constraints if any
    if entity.composite_unique_constraints:
        for i, constraint in enumerate(entity.composite_unique_constraints):
            sql += f",\n    UNIQUE ({', '.join(constraint)})"
    
    # Add check constraints if any
    if entity.check_constraints:
        for constraint in entity.check_constraints:
            sql += f",\n    CHECK ({constraint})"
    
    sql += "\n);\n"

    # Create trigger function for updating updated_at
    sql += f"""
    -- Create trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create trigger for {table_name}
    DROP TRIGGER IF EXISTS update_{entity.name}_updated_at ON public.{table_name};
    CREATE TRIGGER update_{entity.name}_updated_at
        BEFORE UPDATE ON public.{table_name}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """
    
    # Add indexes if present
    if entity.indexes:
        for idx_row in entity.indexes.rows:
            idx_name = idx_row[0]  # Assuming first column is index name
            idx_cols = idx_row[1]  # Assuming second column is column list
            is_unique = idx_row[2] if len(idx_row) > 2 else False  # Optional unique flag
            
            sql += f"\nCREATE {'UNIQUE ' if is_unique else ''}INDEX IF NOT EXISTS {idx_name} "
            sql += f"ON public.{table_name} ({idx_cols});"
    
    # Add permissions
    sql += f"\n\n-- Grant permissions\n"
    sql += f"GRANT ALL ON public.{table_name} TO authenticated;\n"
    sql += f"GRANT SELECT ON public.{table_name} TO anon;\n"
    # Add partition by if specified
    if entity.partition_by:
        sql += f"\nPARTITION BY {entity.partition_by.upper()};"
    
    return sql

def generate_readme(output_dir: Path, domain_model: Dict[str, Any]):
    """Generate README.md with project documentation."""
    readme_content = f"""# {domain_model['title']}

{domain_model['description']}

## Use Cases

"""
    for use_case in domain_model['use_cases']:
        readme_content += f"### {use_case['name']}\n{use_case['description']}\n\n"
    
    readme_content += "\n## Data Model\n\n"
    for entity in domain_model['entities']:
        readme_content += f"### {entity['name']}\n{entity['description']}\n\n"
    
    with open(output_dir / "README.md", "w") as f:
        f.write(readme_content) 

def generate_mock_data_sql(mock_data: List[MockData], mock_users: List[Dict], prefix: str, conn) -> None:
    """Generate and execute mock data insertion using psycopg2"""
    try:
        cur = conn.cursor()
        email_to_uuid = {}  # Map for user emails to UUIDs
        entity_id_map = {}  # Map for entity IDs (e.g., category-1 -> actual UUID)

        # First create or get auth users
        for user_dict in mock_users:
            headers = user_dict['records']['headers']
            rows = user_dict['records']['rows']
            
            for row in rows:
                user_data = dict(zip(headers, row))
                email = user_data['email']
                
                # Check if user already exists
                cur.execute("""
                    SELECT id FROM auth.users WHERE email = %s;
                """, (email,))
                
                existing_user = cur.fetchone()
                
                if existing_user:
                    user_id = existing_user[0]
                    email_to_uuid[email] = user_id
                else:
                    try:
                        # Create new user with generated UUID
                        cur.execute("""
                            INSERT INTO auth.users (
                                instance_id, id, aud, role, email, encrypted_password,
                                email_confirmed_at, last_sign_in_at,
                                raw_app_meta_data, raw_user_meta_data,
                                created_at, updated_at,
                                confirmation_token, email_change,
                                email_change_token_new, recovery_token
                            ) VALUES (
                                '00000000-0000-0000-0000-000000000000',
                                uuid_generate_v4(),
                                'authenticated',
                                'authenticated', %s, crypt(%s, gen_salt('bf')),
                                NOW(), NOW(),
                                '{"provider":"email","providers":["email"]}',
                                '{}',
                                NOW(), NOW(),
                                '', '', '', ''
                            ) RETURNING id, email;
                        """, (email, user_data['password']))
                        
                        user_id, _ = cur.fetchone()
                        email_to_uuid[email] = user_id
                        conn.commit()
                    except Exception as e:
                        print(f"Warning: Could not create user {email}: {e}")
                        conn.rollback()
                        continue

                # Create profiles table and insert profile entry with same UUID as auth.users
                try:
                    # Create profiles table if it doesn't exist
                    create_profiles_table = f"""
                    CREATE TABLE IF NOT EXISTS public.{prefix}_profiles (
                        id UUID PRIMARY KEY REFERENCES auth.users(id),
                        email TEXT NOT NULL UNIQUE,
                        full_name TEXT,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );

                    -- Grant permissions
                    GRANT ALL ON public.{prefix}_profiles TO authenticated;
                    GRANT SELECT ON public.{prefix}_profiles TO anon;

                    -- Create trigger for updated_at
                    CREATE OR REPLACE FUNCTION update_updated_at_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = CURRENT_TIMESTAMP;
                        RETURN NEW;
                    END;
                    $$ language 'plpgsql';

                    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.{prefix}_profiles;
                    CREATE TRIGGER update_profiles_updated_at
                        BEFORE UPDATE ON public.{prefix}_profiles
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();

                    -- Insert profile data
                    INSERT INTO public.{prefix}_profiles 
                    (id, email, full_name, created_at, updated_at)
                    VALUES 
                    (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                    """
                    
                    cur.execute(create_profiles_table, (
                        user_id,
                        email,
                        user_data.get('full_name', email.split('@')[0])
                    ))
                    conn.commit()
                except Exception as e:
                    print(f"Warning: Could not create profile for {email}: {e}")
                    conn.rollback()

        # Then insert mock data in dependency order
        processed = set()
        
        def process_entity(entity_dict: Dict):
            if entity_dict['entity_name'] in processed:
                return
            
            # Process dependencies first
            if entity_dict.get('dependencies'):
                for dep in entity_dict['dependencies']:
                    dep_entity = next((e for e in mock_data if e['entity_name'] == dep), None)
                    if dep_entity and dep not in processed:
                        process_entity(dep_entity)
            
            # Insert records
            if 'records' in entity_dict:
                headers = entity_dict['records']['headers']
                rows = entity_dict['records']['rows']
                
                for row in rows:
                    record_data = dict(zip(headers, row))
                    
                    # Generate and store UUID for this record if it has an ID
                    if 'id' in record_data:
                        original_id = record_data['id']
                        # Check if the value looks like a mock UUID/ID (uuid-, cat-, etc.)
                        if isinstance(original_id, str) and (
                            original_id.startswith(('uuid-', 'cat-', 'id-')) or 
                            '-' in original_id
                        ):
                            # Generate new UUID
                            cur.execute("SELECT uuid_generate_v4();")
                            new_uuid = cur.fetchone()[0]
                            # Store mapping
                            entity_id_map[f"{entity_dict['entity_name']}-{original_id}"] = new_uuid
                            entity_id_map[original_id] = new_uuid  # Store direct mapping as well
                            record_data['id'] = new_uuid
                    
                    # Replace foreign key references with actual UUIDs
                    for key, value in record_data.items():
                        if key.endswith('_id') and value:
                            if isinstance(value, str):
                                if value in email_to_uuid:  # User reference
                                    record_data[key] = email_to_uuid[value]
                                else:  # Entity reference
                                    # First try direct mapping
                                    mapped_id = entity_id_map.get(value)
                                    if not mapped_id:
                                        # Try with entity prefix
                                        referenced_entity = key[:-3]  # Remove '_id'
                                        mapped_id = entity_id_map.get(f"{referenced_entity}-{value}")
                                    
                                    if mapped_id:
                                        record_data[key] = mapped_id
                                    else:
                                        print(f"Warning: No mapping found for {value} in {key}")
                    
                    # Build and execute INSERT query
                    fields = list(record_data.keys())
                    values = list(record_data.values())
                    placeholders = ['%s'] * len(values)
                    
                    try:
                        query = f"""
                            INSERT INTO public.{prefix}_{entity_dict['entity_name']}
                            ({', '.join(fields)})
                            VALUES ({', '.join(placeholders)});
                        """
                        cur.execute(query, values)
                        conn.commit()
                    except Exception as e:
                        print(f"Error inserting into {entity_dict['entity_name']}: {e}")
                        conn.rollback()
            
            processed.add(entity_dict['entity_name'])
        
        # Process all entities
        for entity_dict in mock_data:
            process_entity(entity_dict)
            
    except Exception as e:
        print(f"Error generating mock data: {e}")
        conn.rollback()
        raise 

def setup_logging(output_dir: Path) -> logging.Logger:
    """Setup logging to both file and console"""
    # Create logger
    logger = logging.getLogger('app_generator')
    logger.setLevel(logging.INFO)
    
    # Create file handler
    log_file = output_dir / 'generation.log'
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger 