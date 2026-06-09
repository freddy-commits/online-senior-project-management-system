'use client'

import { useTrack } from '@/components/providers/TrackProvider'

export default function TrackSwitcher() {
  const { trackMode, setTrackMode } = useTrack()

  const isIndustry = trackMode === 'industry' || trackMode === 'partner'
  const isCapstone  = trackMode === 'thesis'   || trackMode === 'advisor'

  return (
    <div className="flex bg-slate-100/80 backdrop-blur-md p-1 rounded-xl items-center border border-slate-200/60 shadow-inner">
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
  )
}
