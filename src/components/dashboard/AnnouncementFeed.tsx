'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Pin, Clock, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)
      
      setAnnouncements(data || [])
      setLoading(false)
    }
    fetchAnnouncements()
  }, [])

  if (loading) return <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900">
          <Megaphone className="w-5 h-5 text-blue-600" />
          University Announcements
        </h2>
        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">View All</button>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? announcements.map((ann, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={ann.id} 
            className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md hover:border-slate-300 transition-all relative group"
          >
            {ann.is_pinned && (
              <div className="absolute top-4 right-4">
                <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
              </div>
            )}
            <h3 className="font-bold text-slate-900 mb-2 pr-8">{ann.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
              {ann.content}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(ann.created_at).toLocaleDateString()}
              </div>
              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-widest">
                {ann.target_role}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <p className="text-slate-500 text-sm">No recent announcements from the department.</p>
          </div>
        )}
      </div>
    </div>
  )
}
