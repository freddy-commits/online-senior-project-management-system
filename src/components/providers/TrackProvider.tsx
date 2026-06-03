'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TrackType = 'industry' | 'thesis' | 'advisor' | 'partner' | 'coordinator' | 'panel' | 'supervisor' | 'admin'

interface TrackContextType {
  trackMode: TrackType
  setTrackMode: (mode: TrackType) => void
}

const TrackContext = createContext<TrackContextType | undefined>(undefined)

export function TrackProvider({ children }: { children: ReactNode }) {
  const [trackMode, setTrackModeState] = useState<TrackType>('industry')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('seniorproj_track_mode') as TrackType
      if (saved && ['industry', 'thesis', 'advisor', 'partner', 'coordinator', 'panel', 'supervisor', 'admin'].includes(saved)) {
        setTrackModeState(saved)
      }
    }
  }, [])

  const setTrackMode = (mode: TrackType) => {
    setTrackModeState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('seniorproj_track_mode', mode)
    }
  }

  return (
    <TrackContext.Provider value={{ trackMode, setTrackMode }}>
      {children}
    </TrackContext.Provider>
  )
}

export function useTrack() {
  const context = useContext(TrackContext)
  if (context === undefined) {
    throw new Error('useTrack must be used within a TrackProvider')
  }
  return context
}
