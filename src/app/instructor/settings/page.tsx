'use client'

import { useState } from 'react'
import { 
  Settings, 
  Scale, 
  ShieldAlert, 
  Save, 
  Award, 
  BookOpen, 
  Clock, 
  Sliders,
  CheckCircle
} from 'lucide-react'

export default function InstructorSettingsPage() {
  const [passingGpa, setPassingGpa] = useState('2.5')
  const [minCommits, setMinCommits] = useState('20')
  const [weights, setWeights] = useState({
    proposal: 15,
    midterm: 25,
    standards: 20,
    final: 30,
    peer: 10
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setTimeout(() => {
      setSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 1000)
  }

  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Evaluation Configurations</h1>
        <p className="text-slate-400">Configure grade weight distributions, project vetting standards, and minimum thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Rubric Weights */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Evaluation Weights Distribution
          </h2>
          <p className="text-slate-500 text-xs mb-8">Distribute weights across milestones. Sum of weights must equal 100%.</p>

          <div className="space-y-6">
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">PROPOSAL</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={weights.proposal}
                  onChange={(e) => setWeights({ ...weights, proposal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">MIDTERM</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={weights.midterm}
                  onChange={(e) => setWeights({ ...weights, midterm: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">STANDARDS</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={weights.standards}
                  onChange={(e) => setWeights({ ...weights, standards: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">FINAL REPORT</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={weights.final}
                  onChange={(e) => setWeights({ ...weights, final: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">PEER EVAL</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={weights.peer}
                  onChange={(e) => setWeights({ ...weights, peer: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Combined Weight</span>
              <span className={`text-sm font-black px-3 py-1 rounded-xl ${totalWeights === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {totalWeights}% {totalWeights === 100 ? '(Valid)' : '(Must equal 100%)'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Thresholds */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Quality Threshold Guidelines
          </h2>
          <p className="text-slate-500 text-xs mb-8">Define performance metrics required for automatic verification checks.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Minimum Advisor GPA Requirement</label>
              <input
                type="number"
                step="0.1"
                min="0" max="4.0"
                value={passingGpa}
                onChange={(e) => setPassingGpa(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-2">Students below this threshold require departmental waiver approval.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Min Repository Commit Target</label>
              <input
                type="number"
                value={minCommits}
                onChange={(e) => setMinCommits(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-2">Minimum commits required in main branch by the final report milestone.</p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-400 flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4" />
                Academic standards updated!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || totalWeights !== 100}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? 'Updating...' : <Save className="w-4 h-4" />}
            Apply Rubrics Configurations
          </button>
        </div>

      </form>
    </div>
  )
}
