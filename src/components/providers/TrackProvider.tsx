'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type TrackType = 'industry' | 'thesis' | 'advisor' | 'partner' | 'coordinator' | 'panel' | 'supervisor' | 'admin'

interface TrackContextType {
  trackMode: TrackType
  setTrackMode: (mode: TrackType) => void
}

const TrackContext = createContext<TrackContextType | undefined>(undefined)

export function TrackProvider({ children }: { children: ReactNode }) {
  const [trackMode, setTrackMode] = useState<TrackType>('industry')

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
