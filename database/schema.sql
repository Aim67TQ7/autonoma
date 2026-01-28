-- Autonoma Database Schema
-- Run this in Supabase SQL Editor

-- Projects table
CREATE TABLE IF NOT EXISTS autonoma_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  scale VARCHAR(50) DEFAULT 'small' CHECK (scale IN ('micro', 'small', 'medium', 'large', 'enterprise')),
  objective TEXT,
  success_criteria JSONB DEFAULT '[]'::jsonb,
  constraints JSONB DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  target_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  health_score INTEGER DEFAULT 75 CHECK (health_score >= 0 AND health_score <= 100),
  intake_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charters table
CREATE TABLE IF NOT EXISTS autonoma_charters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Milestones table
CREATE TABLE IF NOT EXISTS autonoma_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ,
  actual_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS autonoma_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES autonoma_milestones(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  assignee_id UUID,
  assignee_name VARCHAR(255),
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dependencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholders table
CREATE TABLE IF NOT EXISTS autonoma_stakeholders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  raci_level VARCHAR(50) CHECK (raci_level IN ('responsible', 'accountable', 'consulted', 'informed')),
  email VARCHAR(255),
  communication_preference VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risks table
CREATE TABLE IF NOT EXISTS autonoma_risks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  probability VARCHAR(50) CHECK (probability IN ('low', 'medium', 'high')),
  impact VARCHAR(50) CHECK (impact IN ('low', 'medium', 'high')),
  mitigation TEXT,
  status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'mitigating', 'resolved', 'occurred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updates table (for task updates/status reports)
CREATE TABLE IF NOT EXISTS autonoma_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES autonoma_tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  participant_id UUID,
  participant_name VARCHAR(255),
  content TEXT NOT NULL,
  parsed_progress INTEGER,
  parsed_status VARCHAR(50),
  parsed_blockers JSONB DEFAULT '[]'::jsonb,
  channel VARCHAR(50) DEFAULT 'web' CHECK (channel IN ('web', 'email', 'slack', 'api')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalations table
CREATE TABLE IF NOT EXISTS autonoma_escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES autonoma_tasks(id) ON DELETE SET NULL,
  trigger_type VARCHAR(50) CHECK (trigger_type IN ('timeline', 'resource', 'scope', 'communication', 'quality', 'budget')),
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  recommended_action TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  escalated_to VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Conversation messages for project intake
CREATE TABLE IF NOT EXISTS autonoma_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES autonoma_projects(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON autonoma_projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON autonoma_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON autonoma_tasks(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON autonoma_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_updates_project ON autonoma_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_escalations_project ON autonoma_escalations(project_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON autonoma_escalations(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_autonoma_projects_updated_at ON autonoma_projects;
CREATE TRIGGER update_autonoma_projects_updated_at
    BEFORE UPDATE ON autonoma_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_autonoma_tasks_updated_at ON autonoma_tasks;
CREATE TRIGGER update_autonoma_tasks_updated_at
    BEFORE UPDATE ON autonoma_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_autonoma_milestones_updated_at ON autonoma_milestones;
CREATE TRIGGER update_autonoma_milestones_updated_at
    BEFORE UPDATE ON autonoma_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_autonoma_risks_updated_at ON autonoma_risks;
CREATE TRIGGER update_autonoma_risks_updated_at
    BEFORE UPDATE ON autonoma_risks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (disabled for now as per requirements - no auth)
-- ALTER TABLE autonoma_projects ENABLE ROW LEVEL SECURITY;
-- etc.

-- Grant public access (no auth mode)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
