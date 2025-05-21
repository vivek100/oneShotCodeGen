import { Flow, FlowStep } from '../types/flow';

export async function getFlowSteps(flowId: string): Promise<FlowStep[]> {
  try {
    const response = await fetch(`/api/flows/${flowId}/steps`);
    if (!response.ok) {
      throw new Error(`Failed to fetch flow steps: ${response.statusText}`);
    }
    const data = await response.json();
    return data as FlowStep[];
  } catch (error) {
    console.error('Error fetching flow steps:', error);
    throw error;
  }
}

export async function createFlow(flow: Omit<Flow, 'id'>): Promise<Flow> {
  try {
    const response = await fetch('/api/flows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flow),
    });
    if (!response.ok) {
      throw new Error(`Failed to create flow: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Flow;
  } catch (error) {
    console.error('Error creating flow:', error);
    throw error;
  }
}

export async function updateFlow(flowId: string, flow: Partial<Flow>): Promise<Flow> {
  try {
    const response = await fetch(`/api/flows/${flowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flow),
    });
    if (!response.ok) {
      throw new Error(`Failed to update flow: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Flow;
  } catch (error) {
    console.error('Error updating flow:', error);
    throw error;
  }
} 