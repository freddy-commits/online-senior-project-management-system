'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Lightbulb, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function PartnerPitchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [repName, setRepName] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [techStack, setTechStack] = useState('')

  const supabase = createClient()

  async function handlePitchSubmission() {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthenticated partner session')

      // Insert sponsored proposal as projects with industry_partner_id and origin: 'industry'
      const { error: projError } = await supabase
        .from('projects')
        .insert({
          title: projectTitle,
          description: `[Sponsor: ${companyName}] - Rep: ${repName}. Description: ${projectDesc}. Required Stack: ${techStack}`,
          industry_partner_id: user.id,
          status: 'pending',
          origin: 'industry',
          team_members: []
        })

      if (projError) throw projError

      setSuccess(true)
      setTimeout(() => router.push('/partner/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Pitch New Project Proposal</h1>
        <p className="text-slate-500">Offer technical challenges and mentorship sponsorships to senior student squads.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
        
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-20 bg-white/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Problem Statement Vetted!</h2>
            <p className="text-slate-500">Your proposal is sent to the department board. Redirecting...</p>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200">
          {[
            { id: 1, label: 'Company Info', icon: <Building2 className="w-4 h-4" /> },
            { id: 2, label: 'Challenge Pitch', icon: <Lightbulb className="w-4 h-4" /> },
            { id: 3, label: 'Specifications', icon: <Layers className="w-4 h-4" /> }
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : step > s.id 
                    ? 'bg-green-50 text-green-600 border border-green-200' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${step === s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step panels */}
        <div className="min-h-60 mb-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Sponsor Identity Details</h2>
                  <p className="text-slate-500 text-xs mb-6">Tell students about your company name and point of contact representatives.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Company/Organization Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. TechCorp Solutions"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Representative Name</label>
                    <input
                      type="text"
                      required
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      placeholder="e.g. Marcus Aurelius"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Project Challenge Pitch</h2>
                  <p className="text-slate-500 text-xs mb-6">Outline the problem statements you want student developers to build solutions for.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Proposed Project Title</label>
                    <input
                      type="text"
                      required
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="e.g. High-throughput Serverless Gateway Pipeline"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Challenge abstract & description</label>
                    <textarea
                      required
                      rows={4}
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      placeholder="Explain the objectives, expected datasets, and outcomes..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm font-medium resize-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Technical specs & targets</h2>
                  <p className="text-slate-500 text-xs mb-6">Define required engineering stacks, programming frameworks, and databases.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Tech Stack Expectations</label>
                  <input
                    type="text"
                    required
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="e.g. Next.js, FastAPI, PostgreSQL, Docker"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all text-sm font-medium placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div className="flex justify-between border-t border-slate-200 pt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-5 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-0 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1 cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !companyName || !projectTitle || !projectDesc}
              onClick={handlePitchSubmission}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Submitting...' : <Check className="w-4 h-4" />}
              Publish Pitch Proposal
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
