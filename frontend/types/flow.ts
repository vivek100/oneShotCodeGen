export interface FlowStep {
  id?: string;
  name?: string;
  step_type: string;
  tool_name?: string;
  prompt_template?: string;
  output_schema?: Record<string, any>;
  order?: number;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
  created_at?: string;
  updated_at?: string;
} 