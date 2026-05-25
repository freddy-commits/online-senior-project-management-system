'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  CheckCircle, 
  Terminal, 
  Award, 
  Scale, 
  ShieldAlert,
  ChevronRight,
  Code
} from 'lucide-react'

export default function StudentFrameworkPage() {
  const [activeSection, setActiveSection] = useState<'scope' | 'requirements' | 'evaluation'>('scope')

  const criteria = [
    { title: 'Project Scope Definition', desc: 'Detailed requirement analysis, risk assessments, and milestones schedules.' },
    { title: 'Tech Stack Standards', desc: 'Modern stacks utilizing containerization, cloud hosting, and scalable data models.' },
    { title: 'Collaboration Principles', desc: 'Strict git versioning workflows, pull request code reviews, and weekly status sprints.' },
  ]

  const engineeringStandards = [
    { rule: 'Code Quality', spec: 'ESLint compliance, zero compile-time TypeScript warnings, and test coverages above 70%.' },
    { rule: 'Continuous Integration', spec: 'Auto-build validations on main branches using GitHub Actions or GitLab pipelines.' },
    { rule: 'Security Checkpoints', spec: 'No raw secrets, protected Supabase RLS (Row Level Security) policies on all database tables.' },
  ]

  const weights = [
    { item: 'Proposal & Scope', pct: '15%' },
    { item: 'Midterm Prototype Review', pct: '25%' },
    { item: 'Engineering Standard Validation', pct: '20%' },
    { item: 'Final Deliverables & Repository', pct: '30%' },
    { item: 'Peer Evaluation', pct: '10%' },
  ]

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Project Scope & Framework</h1>
        <p className="text-slate-500">Review departmental expectations, quality guidelines, and evaluations criteria.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-4 mb-8 overflow-x-auto">
        {[
          { id: 'scope', label: 'Vetted Scope Guidelines', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'requirements', label: 'Engineering Standards', icon: <Code className="w-4 h-4" /> },
          { id: 'evaluation', label: 'Grading & Evaluation', icon: <Scale className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
        {activeSection === 'scope' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-905 mb-3 text-slate-900">Academic Vetting Protocol</h2>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                All senior projects are peer-reviewed and vetted by the academic board to ensure they satisfy the core criteria for senior engineering designs. The project must solve a real-world problem, contain measurable indicators of performance, and require engineering design calculations or formal architectures.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-4">
              {criteria.map((c, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">{c.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'requirements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Coding Standards & QA</h2>
              <p className="text-slate-500 text-sm font-medium mb-6">
                Your repository is polled periodically to check for consistency with software engineering practices.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-3xl overflow-hidden bg-slate-50">
              {engineeringStandards.map((s, i) => (
                <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{s.rule}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Automated Checks Active</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs max-w-md leading-relaxed font-medium">{s.spec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'evaluation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Course Rubric Allocation</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                The evaluation is continuous. Grades are finalized at the end of the second academic semester by the steering committee based on deliverables and prototype functionality.
              </p>
              
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  <strong className="text-slate-900">Deadlines Policy:</strong> Submissions after 24 hours of due date incur a 10% penalty per day. No submissions are allowed after 7 days post-deadline.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Evaluation Breakdown</h3>
              <div className="space-y-2">
                {weights.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">{w.item}</span>
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{w.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
