'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Mail, Phone, ExternalLink, Loader2 } from 'lucide-react'

export default function SupervisorTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Use authenticated user ID directly from Supabase session
        const targetUserId = user.id

        const { data: projs } = await supabase
          .from('projects')
          .select('*, student:student_id(full_name, email), partner:industry_partner_id(full_name, email), teams:team_id(id, name)')
          .eq('instructor_id', targetUserId)

        if (projs && projs.length > 0) {
          const teamIds = projs.map(p => p.team_id).filter(Boolean)
          let membersMap: Record<string, any[]> = {}

          if (teamIds.length > 0) {
            const { data: members, error: membersError } = await supabase
              .from('team_members')
              .select('*, profiles:user_id(id, full_name, email, avatar_url)')
              .in('team_id', teamIds)

            if (membersError) {
              console.error("Error fetching team members for supervisor:", membersError)
            }

            if (members) {
              members.forEach(m => {
                if (!membersMap[m.team_id]) {
                  membersMap[m.team_id] = []
                }
                membersMap[m.team_id].push(m)
              })
            }
          }

          const enrichedProjs = projs.map(p => ({
            ...p,
            members: p.team_id ? (membersMap[p.team_id] || []) : []
          }))

          setTeams(enrichedProjs)
        } else {
          setTeams([])
        }
      } catch (e) {
        console.error("Teams fetch error:", e)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-8 pb-20 text-slate-800 font-sans">
      <div className="mb-8 space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Academic Supervisor
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Project Teams</h1>
        <p className="text-xs text-slate-500 font-medium">View and contact students and industry partners matching your assignments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[2.25rem] text-slate-400 font-bold text-xs bg-slate-50/30">
          No teams assigned to you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white border border-slate-150 rounded-[2.25rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                    team.partner 
                      ? 'bg-amber-50 border-amber-100 text-amber-800' 
                      : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                  }`}>
                    {team.partner ? 'Industry Track' : 'Capstone Track'}
                  </span>
                  <a 
                    href={`/supervisor/projects/${team.id}`}
                    className="text-slate-450 hover:text-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div>
                  <h3 className="text-md font-black text-slate-900 leading-snug">{team.title}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-2">{team.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-50">
                  {team.members && team.members.length > 0 ? (
                    <div className="space-y-2">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                        Team Roster ({team.teams?.name || 'Assigned Team'})
                      </span>
                      <div className="space-y-2">
                        {team.members.map((member: any) => (
                          <div key={member.user_id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center uppercase shadow-inner">
                              {member.profiles?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || '?'}
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{member.profiles?.full_name}</span>
                              <span className="text-[9.5px] text-slate-400 font-semibold block">{member.profiles?.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                        {team.student?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'ST'}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{team.student?.full_name || 'Unassigned Lead'}</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold block">{team.student?.email || 'No email'}</span>
                      </div>
                    </div>
                  )}

                  {team.partner && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-center">
                        {team.partner?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'PT'}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Sponsor: {team.partner?.full_name}</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold block">{team.partner?.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
