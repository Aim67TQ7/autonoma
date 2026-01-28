// Autonoma Core Types

export type ProjectScale = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';
export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type RACILevel = 'responsible' | 'accountable' | 'consulted' | 'informed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  scale: ProjectScale;
  objective: string;
  success_criteria: string[];
  constraints: string[];
  start_date: string;
  target_end_date: string;
  actual_end_date?: string;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface Charter {
  id: string;
  project_id: string;
  version: number;
  content: CharterContent;
  generated_at: string;
  approved_at?: string;
}

export interface CharterContent {
  executive_summary: string;
  objectives: Objective[];
  scope: {
    in_scope: string[];
    out_of_scope: string[];
  };
  stakeholders: Stakeholder[];
  timeline: Milestone[];
  risks: Risk[];
  communication_plan: string;
  success_metrics: string[];
}

export interface Objective {
  id: string;
  description: string;
  measurable_target: string;
  due_date?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  raci_level: RACILevel;
  email?: string;
  communication_preference?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  completion_percentage: number;
}

export interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'occurred';
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee_id?: string;
  assignee_name?: string;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  completed_at?: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface Update {
  id: string;
  task_id: string;
  project_id: string;
  participant_id: string;
  content: string;
  parsed_progress?: number;
  parsed_status?: TaskStatus;
  parsed_blockers?: string[];
  channel: 'web' | 'email' | 'slack' | 'api';
  created_at: string;
}

export interface Escalation {
  id: string;
  project_id: string;
  task_id?: string;
  trigger_type: 'timeline' | 'resource' | 'scope' | 'communication' | 'quality' | 'budget';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommended_action: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  escalated_to?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    extracted_data?: Partial<ProjectIntakeData>;
    clarification_needed?: string[];
    confidence?: number;
  };
  created_at: string;
}

export interface ProjectIntakeData {
  name?: string;
  description?: string;
  objective?: string;
  success_criteria?: string[];
  key_stakeholders?: string[];
  constraints?: string[];
  target_timeline?: string;
  budget_range?: string;
  team_size?: number;
  dependencies?: string[];
}

export interface HealthScore {
  overall: number;
  timeline: number;
  resource: number;
  quality: number;
  stakeholder: number;
  risk: number;
  factors: {
    name: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    notes?: string;
  }[];
}
