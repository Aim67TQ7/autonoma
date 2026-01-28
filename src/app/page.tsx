'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  FolderKanban, 
  MessageSquare, 
  BarChart3, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  health_score: number;
  tasks_completed: number;
  tasks_total: number;
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeProjects = projects.filter(p => p.status === 'active');
  const avgHealth = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + p.health_score, 0) / activeProjects.length)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Autonoma</h1>
              <p className="text-xs text-gray-400">Autonomous Project Intelligence</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/projects" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Projects
            </Link>
            <Link href="/new" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              New Project
            </Link>
            <Link href="/analytics" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Your AI Project Manager,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Always On
              </span>
            </h2>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed">
              Describe your project in natural language. Autonoma generates comprehensive 
              charters, manages tasks, tracks progress, and escalates issues—autonomously.
            </p>
            <div className="mt-8 flex gap-4">
              <Link 
                href="/new"
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition flex items-center gap-2"
              >
                Start a Project
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/projects"
                className="px-6 py-3 border border-[#2a2a3e] text-gray-300 rounded-lg font-medium hover:bg-[#141420] transition"
              >
                View Projects
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Conversational Intake</h3>
              <p className="mt-2 text-sm text-gray-400">Describe projects naturally, AI extracts all requirements</p>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Auto-Generated Charters</h3>
              <p className="mt-2 text-sm text-gray-400">Complete project documentation in seconds</p>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Health Monitoring</h3>
              <p className="mt-2 text-sm text-gray-400">Real-time project health scoring and alerts</p>
            </div>
            
            <div className="glass rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Smart Escalation</h3>
              <p className="mt-2 text-sm text-gray-400">AI-driven issue detection and escalation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold text-white mb-8">Dashboard Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Projects</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {loading ? '...' : activeProjects.length}
                </p>
              </div>
              <FolderKanban className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Health Score</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {loading ? '...' : `${avgHealth}%`}
                </p>
              </div>
              <BarChart3 className={`w-8 h-8 ${avgHealth >= 70 ? 'text-emerald-400' : avgHealth >= 50 ? 'text-amber-400' : 'text-red-400'}`} />
            </div>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasks This Week</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {loading ? '...' : projects.reduce((sum, p) => sum + p.tasks_completed, 0)}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Tasks</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {loading ? '...' : projects.reduce((sum, p) => sum + (p.tasks_total - p.tasks_completed), 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Projects List */}
      {activeProjects.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Active Projects</h3>
            <Link href="/projects" className="text-indigo-400 hover:text-indigo-300 text-sm">
              View All →
            </Link>
          </div>
          
          <div className="grid gap-4">
            {activeProjects.slice(0, 5).map(project => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className="glass rounded-xl p-6 hover:bg-[#1e1e2e] transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      project.health_score >= 70 ? 'bg-emerald-400' : 
                      project.health_score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {project.tasks_completed}/{project.tasks_total} tasks completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Health Score</p>
                      <p className={`text-xl font-bold ${
                        project.health_score >= 70 ? 'text-emerald-400' : 
                        project.health_score >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {project.health_score}%
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">No Projects Yet</h3>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Start your first project by having a conversation with Autonoma. 
              Just describe what you want to accomplish.
            </p>
            <Link 
              href="/new"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition"
            >
              <MessageSquare className="w-5 h-5" />
              Start a Conversation
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Autonoma v0.1.0 • Autonomous Project Intelligence Platform
          </p>
          <p className="text-sm text-gray-400">
            Powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
