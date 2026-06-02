'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sliders } from 'lucide-react'
import { useTrack } from '@/components/providers/TrackProvider'

export default function TrackSwitcher() {
  const { trackMode, setTrackMode } = useTrack()
  const [showDropdown, setShowDropdown] = useState(false)

  // Determine if it's Track A (Industry) or Track B (Thesis) based on current mode
  const isIndustry = trackMode === 'industry' || trackMode === 'partner'
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor'

  return (
    <div className="flex items-center gap-4">
      {/* Dual-pill badges */}
      <div className="hidden sm:flex bg-slate-100/80 backdrop-blur-md p-1 rounded-xl items-center border border-slate-200/60 shadow-inner">
        <button 
          onClick={() => setTrackMode('thesis')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            isCapstone 
              ? 'bg-indigo-700 text-white shadow-sm shadow-indigo-700/20' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Capstone
        </button>
        <button 
          onClick={() => setTrackMode('industry')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            isIndustry
              ? 'bg-indigo-700 text-white shadow-sm shadow-indigo-700/20' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Industry
        </button>
      </div>

      {/* Switch Track utility button */}
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Switch Track</span>
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-slate-900 origin-top-right"
            >
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Select Track Profile
              </div>
              {[
                { label: '🎓 Undergrad - Industry', value: 'industry' },
                { label: '🔬 Senior - Capstone', value: 'thesis' },
                { label: '👨‍🏫 Faculty Advisor', value: 'advisor' },
                { label: '🧑‍💼 Corporate Partner', value: 'partner' },
                { label: '🛠️ Program Coordinator', value: 'coordinator' },
                { label: '⚖️ Evaluation Panel', value: 'panel' },
                { label: '📈 Supervisor View', value: 'supervisor' }
              ].map((mode) => (
                <button 
                  key={mode.value}
                  onClick={() => {
                    setTrackMode(mode.value as any)
                    setShowDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    trackMode === mode.value 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
