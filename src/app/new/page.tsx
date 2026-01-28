'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, 
  Send, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  name?: string;
  description?: string;
  objective?: string;
  success_criteria?: string[];
  key_stakeholders?: string[];
  constraints?: string[];
  target_timeline?: string;
  team_size?: number;
}

export default function NewProject() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Autonoma, your AI project manager. I'll help you define and launch your project.

**Tell me about your project.** What are you trying to accomplish? You can describe it in as much or as little detail as you'd like—I'll ask clarifying questions to ensure we capture everything important.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [phase, setPhase] = useState<'intake' | 'clarification' | 'confirmation' | 'complete'>('intake');
  const [generatingCharter, setGeneratingCharter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            extractedData,
            phase
          }
        })
      });

      if (!res.ok) throw new Error('Failed to process message');

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setExtractedData(data.extractedData);
      setPhase(data.phase);

    } catch (err) {
      console.error('Error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmProject() {
    setGeneratingCharter(true);
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData: extractedData })
      });

      if (!res.ok) throw new Error('Failed to create project');

      const data = await res.json();
      
      // Navigate to the new project
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an error while creating the project. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setGeneratingCharter(false);
    }
  }

  const dataCompleteness = Object.values(extractedData).filter(Boolean).length;
  const requiredFields = ['name', 'objective', 'target_timeline'];
  const hasRequiredFields = requiredFields.every(field => 
    extractedData[field as keyof ExtractedData]
  );

  return (
    <div className="min-h-screen flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-[#141420] transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">New Project</h1>
                <p className="text-xs text-gray-400">Conversational Intake</p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'glass text-gray-100'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-gray-400">Thinking...</span>
                </div>
              </div>
            )}

            {phase === 'confirmation' && hasRequiredFields && (
              <div className="glass rounded-2xl p-6 border border-indigo-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Ready to Create Project</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  I have all the information needed to generate your project charter. 
                  Click below to create the project and generate the full charter.
                </p>
                <button
                  onClick={handleConfirmProject}
                  disabled={generatingCharter}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingCharter ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Charter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Project & Generate Charter
                    </>
                  )}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[#2a2a3e] bg-[#0a0a0f]/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe your project..."
                disabled={loading || generatingCharter}
                className="flex-1 px-4 py-3 bg-[#141420] border border-[#2a2a3e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || generatingCharter}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar - Extracted Data */}
      <aside className="w-80 border-l border-[#2a2a3e] bg-[#0a0a0f] p-6 hidden lg:block overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Project Data</h2>
        </div>

        <div className="space-y-4">
          <DataField label="Name" value={extractedData.name} />
          <DataField label="Objective" value={extractedData.objective} />
          <DataField label="Timeline" value={extractedData.target_timeline} />
          <DataField label="Team Size" value={extractedData.team_size?.toString()} />
          
          {extractedData.success_criteria && extractedData.success_criteria.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Success Criteria</p>
              <ul className="space-y-1">
                {extractedData.success_criteria.map((criterion, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {extractedData.key_stakeholders && extractedData.key_stakeholders.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Stakeholders</p>
              <div className="flex flex-wrap gap-2">
                {extractedData.key_stakeholders.map((stakeholder, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 bg-[#141420] rounded-md text-xs text-gray-300"
                  >
                    {stakeholder}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extractedData.constraints && extractedData.constraints.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Constraints</p>
              <ul className="space-y-1">
                {extractedData.constraints.map((constraint, i) => (
                  <li key={i} className="text-sm text-gray-300">• {constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 pt-6 border-t border-[#2a2a3e]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Completeness</p>
            <p className="text-xs text-indigo-400">{Math.round((dataCompleteness / 8) * 100)}%</p>
          </div>
          <div className="h-2 bg-[#141420] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(dataCompleteness / 8) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Phase: <span className="text-white capitalize">{phase}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}

function DataField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {value ? (
        <p className="text-sm text-white">{value}</p>
      ) : (
        <p className="text-sm text-gray-500 italic">Not specified yet</p>
      )}
    </div>
  );
}
