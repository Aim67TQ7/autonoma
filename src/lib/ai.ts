// Autonoma AI Service - Core Intelligence Layer

import Anthropic from '@anthropic-ai/sdk';
import { ProjectIntakeData, CharterContent, ProjectScale, HealthScore } from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are Autonoma, an autonomous project intelligence system that helps organizations initiate, plan, and manage projects. You are a professional, experienced project manager AI.

Your responsibilities:
1. Help users define projects through natural conversation
2. Extract key project parameters (objectives, constraints, stakeholders, timeline)
3. Ask clarifying questions when information is incomplete
4. Generate comprehensive project charters
5. Provide project management guidance

Communication style:
- Professional but approachable
- Concise and clear
- Ask one clarifying question at a time
- Summarize what you've understood before asking for more

Always extract and track these project parameters during intake:
- Project name and description
- Primary objective and success criteria
- Key stakeholders and their roles
- Timeline expectations
- Known constraints (budget, resources, dependencies)
- Team size and composition`;

export interface ConversationContext {
  messages: { role: 'user' | 'assistant'; content: string }[];
  extractedData: Partial<ProjectIntakeData>;
  phase: 'intake' | 'clarification' | 'confirmation' | 'complete';
}

export async function processIntakeMessage(
  userMessage: string,
  context: ConversationContext
): Promise<{
  response: string;
  extractedData: Partial<ProjectIntakeData>;
  phase: ConversationContext['phase'];
  confidence: number;
}> {
  const messages = [
    ...context.messages,
    { role: 'user' as const, content: userMessage }
  ];

  const prompt = `Current extracted project data:
${JSON.stringify(context.extractedData, null, 2)}

Current phase: ${context.phase}

User message: "${userMessage}"

Instructions:
1. Update the extracted project data based on the user's message
2. Determine what information is still missing
3. If key information is missing, ask ONE clarifying question
4. If all essential information is gathered (name, objective, success criteria, timeline, stakeholders), move to confirmation phase
5. In confirmation phase, summarize the project and ask for approval

Respond in JSON format:
{
  "response": "Your conversational response to the user",
  "extractedData": { updated project data },
  "phase": "intake" | "clarification" | "confirmation" | "complete",
  "confidence": 0.0-1.0,
  "missingFields": ["list of missing important fields"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      ...messages.slice(0, -1).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: prompt }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        response: content.text,
        extractedData: context.extractedData,
        phase: context.phase,
        confidence: 0.5
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      response: parsed.response,
      extractedData: { ...context.extractedData, ...parsed.extractedData },
      phase: parsed.phase || context.phase,
      confidence: parsed.confidence || 0.7
    };
  } catch {
    return {
      response: content.text,
      extractedData: context.extractedData,
      phase: context.phase,
      confidence: 0.5
    };
  }
}

export async function generateCharter(
  projectData: ProjectIntakeData
): Promise<CharterContent> {
  const prompt = `Generate a comprehensive project charter based on the following project information:

${JSON.stringify(projectData, null, 2)}

Create a detailed charter with:
1. Executive summary (2-3 paragraphs)
2. SMART objectives with measurable targets
3. Scope definition (in-scope and out-of-scope items)
4. Stakeholder matrix with RACI assignments
5. Timeline with realistic milestones
6. Risk register with probability, impact, and mitigation strategies
7. Communication plan
8. Success metrics

Return the charter as a JSON object matching this structure:
{
  "executive_summary": "string",
  "objectives": [{"id": "string", "description": "string", "measurable_target": "string", "due_date": "string"}],
  "scope": {"in_scope": ["string"], "out_of_scope": ["string"]},
  "stakeholders": [{"id": "string", "name": "string", "role": "string", "raci_level": "responsible|accountable|consulted|informed"}],
  "timeline": [{"id": "string", "name": "string", "description": "string", "target_date": "string", "status": "pending", "completion_percentage": 0}],
  "risks": [{"id": "string", "description": "string", "probability": "low|medium|high", "impact": "low|medium|high", "mitigation": "string", "status": "identified"}],
  "communication_plan": "string",
  "success_metrics": ["string"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: 'You are a professional project management expert. Generate detailed, actionable project charters. Always respond with valid JSON only.',
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse charter JSON');
  }

  return JSON.parse(jsonMatch[0]) as CharterContent;
}

export function determineProjectScale(data: ProjectIntakeData): ProjectScale {
  const teamSize = data.team_size || 5;
  
  if (teamSize <= 3) return 'micro';
  if (teamSize <= 10) return 'small';
  if (teamSize <= 50) return 'medium';
  if (teamSize <= 200) return 'large';
  return 'enterprise';
}

export async function analyzeUpdate(
  updateContent: string,
  taskContext: { title: string; description: string; current_status: string }
): Promise<{
  progress_percentage: number;
  new_status: string;
  blockers: string[];
  sentiment: 'positive' | 'neutral' | 'concerning';
  summary: string;
}> {
  const prompt = `Analyze this project update and extract structured information:

Task: ${taskContext.title}
Description: ${taskContext.description}
Current Status: ${taskContext.current_status}

Update from team member:
"${updateContent}"

Return JSON:
{
  "progress_percentage": 0-100,
  "new_status": "pending|in_progress|blocked|completed",
  "blockers": ["list any blockers mentioned"],
  "sentiment": "positive|neutral|concerning",
  "summary": "one sentence summary"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse update analysis');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateEscalationRecommendation(
  projectContext: {
    name: string;
    health_score: number;
    overdue_tasks: number;
    blocked_tasks: number;
    recent_issues: string[];
  }
): Promise<{
  should_escalate: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_type: string;
  recommended_action: string;
  message: string;
}> {
  const prompt = `Analyze this project status and determine if escalation is needed:

Project: ${projectContext.name}
Health Score: ${projectContext.health_score}/100
Overdue Tasks: ${projectContext.overdue_tasks}
Blocked Tasks: ${projectContext.blocked_tasks}
Recent Issues: ${projectContext.recent_issues.join(', ')}

Determine if escalation is needed. Return JSON:
{
  "should_escalate": boolean,
  "severity": "low|medium|high|critical",
  "trigger_type": "timeline|resource|scope|communication|quality|budget",
  "recommended_action": "what should be done",
  "message": "escalation message for stakeholders"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse escalation recommendation');
  }

  return JSON.parse(jsonMatch[0]);
}

export function calculateHealthScore(project: {
  tasks: { status: string; due_date?: string }[];
  milestones: { status: string; target_date: string }[];
  escalations: { status: string; severity: string }[];
  updates_this_week: number;
}): HealthScore {
  const now = new Date();
  
  // Timeline score
  const overdueTasks = project.tasks.filter(t => 
    t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
  ).length;
  const totalTasks = project.tasks.length || 1;
  const timelineScore = Math.max(0, 100 - (overdueTasks / totalTasks) * 100);
  
  // Resource score (based on update frequency)
  const resourceScore = Math.min(100, project.updates_this_week * 20);
  
  // Quality score (based on completed vs blocked)
  const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = project.tasks.filter(t => t.status === 'blocked').length;
  const qualityScore = totalTasks > 0 
    ? ((completedTasks - blockedTasks) / totalTasks) * 100 + 50
    : 50;
  
  // Risk score (based on open escalations)
  const openEscalations = project.escalations.filter(e => e.status === 'open').length;
  const criticalEscalations = project.escalations.filter(e => 
    e.status === 'open' && e.severity === 'critical'
  ).length;
  const riskScore = Math.max(0, 100 - (openEscalations * 10) - (criticalEscalations * 20));
  
  // Overall score
  const overall = Math.round(
    (timelineScore * 0.3) + 
    (resourceScore * 0.2) + 
    (qualityScore * 0.25) + 
    (riskScore * 0.25)
  );
  
  return {
    overall: Math.max(0, Math.min(100, overall)),
    timeline: Math.round(timelineScore),
    resource: Math.round(resourceScore),
    quality: Math.round(Math.max(0, Math.min(100, qualityScore))),
    stakeholder: 75, // Default until we have stakeholder feedback
    risk: Math.round(riskScore),
    factors: [
      { name: 'Timeline', score: Math.round(timelineScore), trend: overdueTasks > 0 ? 'down' : 'stable' },
      { name: 'Resources', score: Math.round(resourceScore), trend: 'stable' },
      { name: 'Quality', score: Math.round(Math.max(0, Math.min(100, qualityScore))), trend: 'stable' },
      { name: 'Risk', score: Math.round(riskScore), trend: openEscalations > 0 ? 'down' : 'stable' }
    ]
  };
}
