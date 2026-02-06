'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Minus,
  Plus,
  Loader2,
  X,
  Edit3,
  Trash2,
  Filter
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
  description?: string;
  status: string;
  priority: string;
  assignee_name?: string;
  due_date?: string;
  milestone_id?: string;
}

type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';
type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

const STATUS_CYCLE: TaskStatus[] = ['pending', 'in_progress', 'completed'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed'
};
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'normal', 'high', 'critical'];

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee_name: string;
  due_date: string;
  milestone_id: string;
}

const EMPTY_FORM: TaskFormData = {
  title: '',
  description: '',
  priority: 'normal',
  assignee_name: '',
  due_date: '',
  milestone_id: ''
};

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [charter, setCharter] = useState<Charter | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'charter' | 'tasks' | 'risks'>('overview');

  // Task management state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  function openCreateTask() {
    setEditingTask(null);
    setTaskForm(EMPTY_FORM);
    setShowTaskModal(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority as TaskPriority,
      assignee_name: task.assignee_name || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      milestone_id: task.milestone_id || ''
    });
    setShowTaskModal(true);
  }

  async function handleSaveTask() {
    if (!taskForm.title.trim()) return;
    setSaving(true);

    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
            assignee_name: taskForm.assignee_name || null,
            due_date: taskForm.due_date || null,
            milestone_id: taskForm.milestone_id || null
          })
        });
        if (res.ok) {
          const { task } = await res.json();
          setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
            assignee_name: taskForm.assignee_name || null,
            due_date: taskForm.due_date || null,
            milestone_id: taskForm.milestone_id || null
          })
        });
        if (res.ok) {
          const { task } = await res.json();
          setTasks(prev => [task, ...prev]);
        }
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm(EMPTY_FORM);
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSaving(false);
    }
  }

  async function cycleTaskStatus(task: Task) {
    const currentIdx = STATUS_CYCLE.indexOf(task.status as TaskStatus);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  }

  async function toggleBlocked(task: Task) {
    const newStatus = task.status === 'blocked' ? 'pending' : 'blocked';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  }

  async function deleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setShowDeleteConfirm(null);

    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchProjectData(); // Refetch on error
    }
  }

  const filteredTasks = statusFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === statusFilter);

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
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const healthColor = project.health_score >= 70 ? 'text-emerald-400' :
                      project.health_score >= 50 ? 'text-amber-400' : 'text-red-400';

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

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
                {tab === 'tasks' && tasks.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-[#2a2a3e] text-xs">
                    {tasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
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

              {/* Milestones */}
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

              {/* Recent Tasks (overview) */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
                  </div>
                  <button
                    onClick={openCreateTask}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                </div>

                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-[#141420] rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => cycleTaskStatus(task)}
                            title={`Status: ${STATUS_LABELS[task.status]} (click to cycle)`}
                            className={`w-3 h-3 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white/30 transition ${
                              task.status === 'completed' ? 'bg-emerald-400' :
                              task.status === 'in_progress' ? 'bg-indigo-400' :
                              task.status === 'blocked' ? 'bg-red-400' :
                              'bg-gray-400'
                            }`}
                          />
                          <span className={`text-white ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                            {task.title}
                          </span>
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
                          <button
                            onClick={() => openEditTask(task)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2a2a3e] rounded transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 pt-2"
                      >
                        View all {tasks.length} tasks
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm mb-3">No tasks created yet</p>
                    <button
                      onClick={openCreateTask}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                    >
                      Create First Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Tasks</span>
                    <span className="text-white font-medium">{tasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">In Progress</span>
                    <span className="text-indigo-400 font-medium">{inProgressTasks}</span>
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
                  {tasks.length > 0 && (
                    <div className="pt-3 border-t border-[#2a2a3e]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-sm">Progress</span>
                        <span className="text-white text-sm font-medium">
                          {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-[#1a1a2e] rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

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

        {/* Tasks Tab — Full Management */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1">
                  {['all', 'pending', 'in_progress', 'blocked', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        statusFilter === status
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#141420]'
                      }`}
                    >
                      {status === 'all' ? 'All' : STATUS_LABELS[status]}
                      {status !== 'all' && (
                        <span className="ml-1 opacity-60">
                          {tasks.filter(t => t.status === status).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={openCreateTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {/* Task List */}
            <div className="glass rounded-xl p-6">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-[#141420] rounded-lg hover:bg-[#1a1a2e] transition group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          onClick={() => cycleTaskStatus(task)}
                          title={`${STATUS_LABELS[task.status]} — click to advance`}
                          className={`w-4 h-4 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white/30 transition shrink-0 ${
                            task.status === 'completed' ? 'bg-emerald-400' :
                            task.status === 'in_progress' ? 'bg-indigo-400' :
                            task.status === 'blocked' ? 'bg-red-400' :
                            'bg-gray-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className={`text-white font-medium truncate ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{task.assignee_name || 'Unassigned'}</span>
                            <span>•</span>
                            <span>{STATUS_LABELS[task.status]}</span>
                            {task.description && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px]">{task.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => toggleBlocked(task)}
                            title={task.status === 'blocked' ? 'Unblock' : 'Mark blocked'}
                            className={`p-1.5 rounded hover:bg-[#2a2a3e] transition ${
                              task.status === 'blocked' ? 'text-red-400' : 'text-gray-400'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditTask(task)}
                            title="Edit task"
                            className="p-1.5 rounded hover:bg-[#2a2a3e] transition text-gray-400"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {showDeleteConfirm === task.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-2 py-1 bg-[#2a2a3e] text-gray-300 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(task.id)}
                              title="Delete task"
                              className="p-1.5 rounded hover:bg-[#2a2a3e] transition text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  {statusFilter !== 'all' ? (
                    <p className="text-gray-400">No {STATUS_LABELS[statusFilter]?.toLowerCase()} tasks.</p>
                  ) : (
                    <>
                      <p className="text-gray-400 mb-4">No tasks yet. Add your first task to get started.</p>
                      <button
                        onClick={openCreateTask}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                      >
                        Create First Task
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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

      {/* Task Create/Edit Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTaskModal(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-lg mx-4 border border-[#2a2a3e]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 hover:bg-[#2a2a3e] rounded transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details, acceptance criteria, notes..."
                  rows={3}
                  className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              {/* Priority + Assignee row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskForm.assignee_name}
                    onChange={e => setTaskForm(prev => ({ ...prev, assignee_name: e.target.value }))}
                    placeholder="Name"
                    className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Due date + Milestone row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                {milestones.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Milestone</label>
                    <select
                      value={taskForm.milestone_id}
                      onChange={e => setTaskForm(prev => ({ ...prev, milestone_id: e.target.value }))}
                      className="w-full bg-[#141420] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                    >
                      <option value="">None</option>
                      {milestones.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#2a2a3e]">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!taskForm.title.trim() || saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
