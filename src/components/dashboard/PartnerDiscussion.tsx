"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  userId: string
}

export default function PartnerDiscussion({ projectId, userId }: Props) {
  const supabase = createClient()
  const [threads, setThreads] = useState<Array<any>>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!projectId) return
    void loadThreads()
  }, [projectId])

  async function loadThreads() {
    try {
      const { data } = await supabase
        .from('partner_discussions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      setThreads(data || [])
    } catch (e) {
      console.error('Failed to load partner discussion threads', e)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content) return
    setSending(true)
    try {
      const { data, error } = await supabase.from('partner_discussions').insert({
        project_id: projectId,
        sender_id: userId,
        content
      })
      if (error) throw error
      setInput('')
      await loadThreads()
    } catch (err) {
      console.error('Error sending partner discussion message', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-700 font-black">Partner discussion</p>
      <p className="mt-2 text-sm text-slate-600">Threaded discussion for industry partner handoff and team coordination.</p>

      <div className="mt-4 max-h-56 overflow-y-auto space-y-3">
        {threads.length === 0 && (
          <div className="text-sm text-slate-500">No discussion messages yet.</div>
        )}
        {threads.map((t: any) => (
          <div key={t.id} className="rounded-md p-3 bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">{t.sender_id === userId ? 'You' : t.sender_name || 'Partner'}</div>
              <div className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-sm text-slate-700">{t.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a short handoff note or question..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-bold disabled:opacity-60"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
