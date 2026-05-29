'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, 
  RotateCcw, 
  ChevronRight,
  Database,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play
} from 'lucide-react'
import { getDbState, saveDbState, resetDbState } from '@/lib/supabase/mockDb'

export default function SandboxPage() {
  const [dbState, setDbState] = useState<any>(null)
  const [activeTrack, setActiveTrack] = useState<'academic' | 'sponsored'>('sponsored')
  const [activeStep, setActiveStep] = useState<string>('todo') // todo, submitted, awaiting_partner, partner_approved, completed
  const [feedbackSupervisor, setFeedbackSupervisor] = useState('')
  const [feedbackPartner, setFeedbackPartner] = useState('')

  const supabase = createClient()

  useEffect(() => {
    syncSandboxData()
  }, [activeTrack])

  const syncSandboxData = () => {
    const state = getDbState()
    setDbState(state)

    // Locate matching project for selected track
    const project = state.projects.find(p => 
      activeTrack === 'sponsored' ? p.partner_id !== null : p.partner_id === null
    )

    if (project) {
      // Find its first deliverable to trace state
      const delivs = state.deliverables.filter(d => d.project_id === project.id)
      const proposalDeliv = delivs.find(d => d.title === 'Project Proposal') || delivs[0]
      if (proposalDeliv) {
        setActiveStep(proposalDeliv.status)
        setFeedbackSupervisor(proposalDeliv.feedback_supervisor || '')
        setFeedbackPartner(proposalDeliv.feedback_partner || '')
      }
    }
  }

  const handleReset = () => {
    resetDbState()
    syncSandboxData()
    alert('Mock database states re-seeded to defaults.')
  }

  const updateProposalStatus = (newStatus: string, suFeedback = '', paFeedback = '') => {
    const state = getDbState()
    const project = state.projects.find(p => 
      activeTrack === 'sponsored' ? p.partner_id !== null : p.partner_id === null
    )

    if (project) {
      const delivs = state.deliverables.filter(d => d.project_id === project.id)
      const proposalDeliv = delivs.find(d => d.title === 'Project Proposal') || delivs[0]
      if (proposalDeliv) {
        proposalDeliv.status = newStatus as any
        if (suFeedback) proposalDeliv.feedback_supervisor = suFeedback
        if (paFeedback) proposalDeliv.feedback_partner = paFeedback
        
        saveDbState(state)
        setDbState(state)
        setActiveStep(newStatus)
        if (suFeedback) setFeedbackSupervisor(suFeedback)
        if (paFeedback) setFeedbackPartner(paFeedback)
      }
    }
  }

  // State Machine Step Progression
  const handleStudentSubmit = () => {
    updateProposalStatus('submitted', '', '')
  }

  const handleSupervisorVerify = () => {
    if (activeTrack === 'sponsored') {
      updateProposalStatus('awaiting_partner', 'Verified by Faculty Supervisor. Forwarded to Industry sponsor for sign-off.', '')
    } else {
      updateProposalStatus('completed', 'Final project deliverable approved by Academic Supervisor. Project Closed.', '')
    }
  }

  const handlePartnerSignOff = () => {
    updateProposalStatus('partner_approved', 'Verified by Faculty Supervisor. Forwarded to Industry sponsor for sign-off.', 'Sponsored milestone signed off by TechCorp Mentorship.')
  }

  const handleFinalConfirm = () => {
    updateProposalStatus('completed', 'Final project deliverable approved by Academic Supervisor. Project Closed.', 'Sponsored milestone signed off by TechCorp Mentorship.')
  }

  // Define steps for each track state machine visualizer
  const academicSteps = [
    { id: 'todo', label: 'To Do', desc: 'Milestone pending submission', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'submitted', label: 'Submitted', desc: 'Academic review requested', icon: <Clock className="w-5 h-5" /> },
    { id: 'completed', label: 'Completed', desc: 'Milestone closed directly', icon: <CheckCircle2 className="w-5 h-5" /> }
  ]

  const sponsoredSteps = [
    { id: 'todo', label: 'To Do', desc: 'Milestone pending submission', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'submitted', label: 'Submitted', desc: 'Academic review requested', icon: <Clock className="w-5 h-5" /> },
    { id: 'awaiting_partner', label: 'Awaiting Sponsor', desc: 'Partner sign-off required', icon: <Building className="w-5 h-5" /> },
    { id: 'partner_approved', label: 'Sponsor Signed', desc: 'Approved by industry partner', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'completed', label: 'Completed', desc: 'Milestone closed & graded', icon: <CheckCircle2 className="w-5 h-5" /> }
  ]

  const currentSteps = activeTrack === 'sponsored' ? sponsoredSteps : academicSteps

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-8 md:p-12 relative overflow-hidden font-sans">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-violet-600/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto z-10 relative space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/40 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Milestone State Machine Playground</h1>
              <p className="text-slate-400 text-sm mt-1">
                Toggle capstone tracks, interact with supervisor-student allocations, and trigger step progressions.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Playground DB
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
            >
              Go to Active Dashboard
            </button>
          </div>
        </div>

        {/* Track Toggle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTrack('academic')}
            className={`p-6 rounded-[2rem] border text-left transition-all ${
              activeTrack === 'academic' 
                ? 'bg-slate-900 border-violet-500/40 shadow-xl' 
                : 'bg-slate-900/20 border-slate-800/80 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2 text-violet-400">
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Internal Track</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-2">Academic Capstone Project</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              No sponsored partner. Deliverable reviews bypass partner verification and close immediately upon Academic Supervisor sign-off.
            </p>
          </button>

          <button
            onClick={() => setActiveTrack('sponsored')}
            className={`p-6 rounded-[2rem] border text-left transition-all ${
              activeTrack === 'sponsored' 
                ? 'bg-slate-900 border-indigo-500/40 shadow-xl' 
                : 'bg-slate-900/20 border-slate-800/80 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2 text-indigo-400">
              <Building className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sponsored Track</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-2">Industry-Sponsored Capstone Project</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Mapped to an industry partner. Requires a dual-layered sign-off process involving both supervisor approval and partner verification.
            </p>
          </button>
        </div>

        {/* Visual Pipeline */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-8">
            Visual Status Progression Flow
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
            {currentSteps.map((step, idx) => {
              const isPast = currentSteps.findIndex(s => s.id === activeStep) >= idx
              const isActive = activeStep === step.id

              return (
                <div key={step.id} className="flex-1 flex flex-col items-center text-center relative z-10 w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10 animate-pulse'
                      : isPast
                      ? 'bg-violet-500/10 border-violet-500/40 text-violet-400'
                      : 'bg-slate-950 border-slate-850 text-slate-600'
                  }`}>
                    {step.icon}
                  </div>
                  <h4 className={`text-xs font-black mt-3 transition-colors ${isActive ? 'text-emerald-400' : isPast ? 'text-white' : 'text-slate-500'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[9px] text-slate-500 mt-1 max-w-[120px]">{step.desc}</p>
                </div>
              )
            })}

            {/* Connecting lines for desktop */}
            <div className="absolute top-6 left-6 right-6 h-[2px] bg-slate-800/80 z-0 hidden md:block" />
          </div>
        </div>

        {/* State Controllers & Real-Time Feedbacks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Simulation Controllers */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Simulation Controllers
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleStudentSubmit}
                disabled={activeStep !== 'todo'}
                className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 disabled:text-slate-500 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
              >
                <span>1. Simulate Student Deliverable Upload</span>
                <Play className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              </button>

              <button
                onClick={handleSupervisorVerify}
                disabled={activeStep !== 'submitted'}
                className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 disabled:text-slate-500 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
              >
                <span>2. Simulate Supervisor Verification</span>
                <Play className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </button>

              {activeTrack === 'sponsored' && (
                <>
                  <button
                    onClick={handlePartnerSignOff}
                    disabled={activeStep !== 'awaiting_partner'}
                    className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 disabled:text-slate-500 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>3. Simulate Industry Partner Sign-off</span>
                    <Play className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </button>

                  <button
                    onClick={handleFinalConfirm}
                    disabled={activeStep !== 'partner_approved'}
                    className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 text-slate-200 disabled:text-slate-500 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>4. Confirm Sponsor Sign-off &amp; Complete</span>
                    <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Real-time State Specs */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Simulated Database Payloads
            </h2>

            <div className="space-y-4 text-xs font-semibold text-slate-400">
              <div className="flex justify-between border-b border-slate-800/40 pb-3">
                <span>Active Deliverable State</span>
                <span className="text-emerald-400 font-mono">{activeStep.toUpperCase()}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                  Supervisor Vetting comments
                </span>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-slate-300 italic min-h-[60px] leading-relaxed">
                  {feedbackSupervisor || 'No supervisor vetting remarks registered yet.'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                  Industry Partner comments
                </span>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-slate-300 italic min-h-[60px] leading-relaxed">
                  {feedbackPartner || 'No partner sign-off comments registered yet.'}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
