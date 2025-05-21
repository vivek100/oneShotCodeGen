from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from .database import Base

# Helper function to generate UUIDs
def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    messages = relationship("Message", back_populates="project")
    app_versions = relationship("AppVersion", back_populates="project")
    flow_runs = relationship("FlowRun", back_populates="project")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system, error
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    project = relationship("Project", back_populates="messages")

class AgentFlow(Base):
    __tablename__ = "agent_flows"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    version = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    start_message = Column(Text, nullable=True)
    complete_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    steps = relationship("AgentStep", back_populates="flow")
    flow_runs = relationship("FlowRun", back_populates="flow")

class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(String, primary_key=True, default=generate_uuid)
    flow_id = Column(String, ForeignKey("agent_flows.id"), nullable=False)
    name = Column(String, nullable=False)
    step_type = Column(String, nullable=False)  # ai_single, ai_loop, tool_call
    tool_name = Column(String, nullable=True)
    order = Column(Integer, nullable=False)
    input_map = Column(SQLiteJSON, nullable=False)
    loop_key = Column(String, nullable=True)
    system_message = Column(Text, nullable=False)
    prompt_template_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    output_schema_id = Column(String, ForeignKey("schemas.id"), nullable=False)
    pydantic_schema_id = Column(String, ForeignKey("pydantic_schemas.id"), nullable=True)
    one_shot_id = Column(String, ForeignKey("one_shot_examples.id"), nullable=True)
    start_message = Column(Text, nullable=True)
    complete_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    flow = relationship("AgentFlow", back_populates="steps")
    prompt_template = relationship("Prompt")
    output_schema = relationship("Schema")
    pydantic_schema = relationship("PydanticSchema")
    one_shot = relationship("OneShotExample")
    step_runs = relationship("StepRun", back_populates="step")

class FlowRun(Base):
    __tablename__ = "flow_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    flow_id = Column(String, ForeignKey("agent_flows.id"), nullable=False)
    status = Column(String, nullable=False)  # pending, running, complete, error
    output = Column(SQLiteJSON, nullable=True)
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    project = relationship("Project", back_populates="flow_runs")
    flow = relationship("AgentFlow", back_populates="flow_runs")
    step_runs = relationship("StepRun", back_populates="flow_run")
    app_version = relationship("AppVersion", back_populates="flow_run", uselist=False)

class StepRun(Base):
    __tablename__ = "step_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    flow_run_id = Column(String, ForeignKey("flow_runs.id"), nullable=False)
    step_id = Column(String, ForeignKey("agent_steps.id"), nullable=False)
    status = Column(String, nullable=False)  # running, success, error, skipped
    input_data = Column(SQLiteJSON, nullable=False)
    output_data = Column(SQLiteJSON, nullable=True)
    error_message = Column(Text, nullable=True)
    rendered_prompt = Column(Text, nullable=True)
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    flow_run = relationship("FlowRun", back_populates="step_runs")
    step = relationship("AgentStep", back_populates="step_runs")

class AppVersion(Base):
    __tablename__ = "app_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    flow_run_id = Column(String, ForeignKey("flow_runs.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    config_json = Column(SQLiteJSON, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    project = relationship("Project", back_populates="app_versions")
    flow_run = relationship("FlowRun", back_populates="app_version")

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    template = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Schema(Base):
    __tablename__ = "schemas"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    schema_json = Column(SQLiteJSON, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class PydanticSchema(Base):
    __tablename__ = "pydantic_schemas"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path to the Python file with the Pydantic model
    model_class_name = Column(String, nullable=False)  # Name of the class in the file to use
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class OneShotExample(Base):
    __tablename__ = "one_shot_examples"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    input_json = Column(SQLiteJSON, nullable=False)
    output_json = Column(SQLiteJSON, nullable=False)
    linked_step_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now()) 