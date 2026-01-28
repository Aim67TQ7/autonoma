'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Plus,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  scale: string;
  objective: string;
  success_criteria: string[];
  health_score: number;
  target_end_date: string;
  created_at: string;
}

interface Charter {
  executive_summary: string;
  objectives: { description: string; measurable_target: string }[];
  scope: { in_scope: string[]; out_of_scope: string[] };
  stakeholders: { name: string; role: string; raci_level: string }[];
  timeline: { name: string; target_date: string; status: string }[];
  risks: { description: string; probability: string; impact: string; mitigation: string; status: string }[];
  success_metrics: string[];
}

interface Milestone {
  id: string;
  name: string;
  target_date: string;
  status: string;
  completion_percentage: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee_name?: string;
  due_date?: string;
}

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [charter, setCharter] = useState<Charter | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'charter' | 'tasks' | 'risks'>('overview');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  async function fetchProjectData() {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setCharter(data.charter?.content);
        setMilestones(data.milestones || []);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Project not found</h2>
          <Link href="/projects" className="mt-4 text-indigo-400 hover:text-indigo-300">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const healthColor = project.health_score >= 70 ? 'text-emerald-400' : 
                      project.health_score >= 50 ? 'text-amber-400' : 'text-red-400';

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projects" className="p-2 rounded-lg hover:bg-[#141420] transition">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white">{project.name}</h1>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    project.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{project.scale} scale project</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-400">Health Score</p>
                <p className={`text-2xl font-bold ${healthColor}`}>{project.health_score}%</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['overview', 'charter', 'tasks', 'risks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-[#141420]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Objective */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white">Objective</h3>
                </div>
                <p className="text-gray-300">{project.objective}</p>
                
                {project.success_criteria && project.success_criteria.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a3e]">
                    <p className="text-sm text-gray-400 mb-2">Success Criteria</p>
                    <ul className="space-y-2">
                      {project.success_criteria.map((criterion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Timeline / Milestones */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Milestones</h3>
                  </div>
                </div>

                {milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map(milestone => (
                      <div 
                        key={milestone.id}
                        className="flex items-center justify-between p-3 bg-[#141420] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            milestone.status === 'completed' ? 'bg-emerald-400' :
                            milestone.status === 'in_progress' ? 'bg-indigo-400' :
                            milestone.status === 'missed' ? 'bg-red-400' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{milestone.name}</p>
                            <p className="text-xs text-gray-400">
                              {milestone.target_date && format(new Date(milestone.target_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{milestone.completion_percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No milestones defined yet</p>
                )}
              </div>

              {/* Recent Tasks */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Tasks</h3>
                  </div>
                  <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                </div>

                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map(task => (
                      <div 
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-[#141420] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-emerald-400' :
                            task.status === 'in_progress' ? 'bg-indigo-400' :
                            task.status === 'blocked' ? 'bg-red-400' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-white">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {task.assignee_name && (
                            <span className="text-xs text-gray-400">{task.assignee_name}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No tasks created yet</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Tasks</span>
                    <span className="text-white font-medium">{tasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-emerald-400 font-medium">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Blocked</span>
                    <span className="text-red-400 font-medium">{blockedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Milestones</span>
                    <span className="text-white font-medium">{milestones.length}</span>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Created</p>
                    <p className="text-white">{format(new Date(project.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  {project.target_end_date && (
                    <div>
                      <p className="text-gray-400">Target End</p>
                      <p className="text-white">{format(new Date(project.target_end_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400">Scale</p>
                    <p className="text-white capitalize">{project.scale}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charter Tab */}
        {activeTab === 'charter' && charter && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Executive Summary</h3>
              <p className="text-gray-300 leading-relaxed">{charter.executive_summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">In Scope</h3>
                <ul className="space-y-2">
                  {charter.scope.in_scope.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Out of Scope</h3>
                <ul className="space-y-2">
                  {charter.scope.out_of_scope.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <Minus className="w-4 h-4 text-gray-400 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Stakeholders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-400 border-b border-[#2a2a3e]">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">RACI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charter.stakeholders.map((stakeholder, i) => (
                      <tr key={i} className="border-b border-[#2a2a3e]/50">
                        <td className="py-3 text-white">{stakeholder.name}</td>
                        <td className="py-3 text-gray-300">{stakeholder.role}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            stakeholder.raci_level === 'responsible' ? 'bg-indigo-500/20 text-indigo-400' :
                            stakeholder.raci_level === 'accountable' ? 'bg-purple-500/20 text-purple-400' :
                            stakeholder.raci_level === 'consulted' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {stakeholder.raci_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Success Metrics</h3>
              <ul className="space-y-2">
                {charter.success_metrics.map((metric, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">All Tasks</h3>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-[#141420] rounded-lg hover:bg-[#1a1a2e] transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-emerald-400' :
                        task.status === 'in_progress' ? 'bg-indigo-400' :
                        task.status === 'blocked' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <p className="text-xs text-gray-400">
                          {task.assignee_name || 'Unassigned'} • {task.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {task.due_date && (
                        <span className="text-sm text-gray-400">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        task.priority === 'normal' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No tasks yet. Add your first task to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && charter && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Risk Register</h3>
            
            {charter.risks && charter.risks.length > 0 ? (
              <div className="space-y-4">
                {charter.risks.map((risk, i) => (
                  <div key={i} className="p-4 bg-[#141420] rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium">{risk.description}</p>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          risk.probability === 'high' ? 'bg-red-500/20 text-red-400' :
                          risk.probability === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          P: {risk.probability}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          risk.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                          risk.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          I: {risk.impact}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-500">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No risks identified yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
