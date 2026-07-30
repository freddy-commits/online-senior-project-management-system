'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAllUsers, updateUserRole, deleteUserAccount, assignSupervisorToStudent, getAllSupervisors } from './actions'
import { 
  Users, 
  Search, 
  UserCog, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  X, 
  Mail, 
  Building,
  GraduationCap,
  Briefcase,
  Sliders,
  Check,
  UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  student:          { label: 'Student Lead',         bg: 'bg-blue-50/70',   text: 'text-blue-700',    border: 'border-blue-200/50',   icon: GraduationCap },
  instructor:       { label: 'Lead Coordinator',     bg: 'bg-emerald-50/70',text: 'text-emerald-700', border: 'border-emerald-200/50',icon: ShieldCheck },
  supervisor:       { label: 'Academic Supervisor',  bg: 'bg-cyan-50/70',   text: 'text-cyan-700',    border: 'border-cyan-200/50',   icon: Briefcase },
  industry_partner: { label: 'Industry Partner',     bg: 'bg-indigo-50/70', text: 'text-indigo-700',  border: 'border-indigo-200/50', icon: Building },
  examiner:         { label: 'Panel Examiner',       bg: 'bg-rose-50/70',   text: 'text-rose-700',    border: 'border-rose-200/50',   icon: Sliders },
  admin:            { label: 'System Admin',         bg: 'bg-purple-50/70', text: 'text-purple-700',  border: 'border-purple-200/50', icon: ShieldAlert },
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Modals state
  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null)
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<any | null>(null)
  const [selectedStudentForSupervisor, setSelectedStudentForSupervisor] = useState<any | null>(null)
  const [roleInput, setRoleInput] = useState('')
  const [supervisorInput, setSupervisorInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function loadData() {
      const [userData, supervisorData] = await Promise.all([getAllUsers(), getAllSupervisors()])
      setUsers(userData)
      setSupervisors(supervisorData)
      
      // Determine the logged-in admin email from localStorage/session if possible
      if (typeof window !== 'undefined') {
        const storedEmail = localStorage.getItem('active_user_email') || 'admin@ueab.ac.ke'
        const currentAdmin = userData.find((u: any) => u.email?.toLowerCase() === storedEmail.toLowerCase())
        if (currentAdmin) {
          setCurrentUser(currentAdmin)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const handleUpdateRole = async () => {
    if (!selectedUserForRole || !roleInput) return
    setActionLoading(true)
    setMessage(null)
    try {
      await updateUserRole(selectedUserForRole.id, roleInput)
      setUsers(prev => prev.map(u => u.id === selectedUserForRole.id ? { ...u, role: roleInput } : u))
      setMessage({ text: `Successfully updated ${selectedUserForRole.full_name}'s role to ${roleInput}.`, type: 'success' })
      setSelectedUserForRole(null)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update role.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return
    setActionLoading(true)
    setMessage(null)
    try {
      await deleteUserAccount(selectedUserForDelete.id)
      setUsers(prev => prev.filter(u => u.id !== selectedUserForDelete.id))
      setMessage({ text: `Successfully deleted account for ${selectedUserForDelete.full_name}.`, type: 'success' })
      setSelectedUserForDelete(null)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete user.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignSupervisor = async () => {
    if (!selectedStudentForSupervisor || !supervisorInput) return
    setActionLoading(true)
    setMessage(null)
    try {
      await assignSupervisorToStudent(selectedStudentForSupervisor.id, supervisorInput)
      const supervisor = supervisors.find(s => s.id === supervisorInput)
      
      // Update local state so it reflects immediately without a page reload
      setUsers(prev => prev.map(u => {
        if (u.id === selectedStudentForSupervisor.id) {
          return {
            ...u,
            supervisor_id: supervisorInput,
            supervisor_name: supervisor?.full_name || null,
            needs_supervisor: false
          }
        }
        return u
      }))

      setMessage({ 
        text: `Successfully assigned ${supervisor?.full_name || 'supervisor'} to ${selectedStudentForSupervisor.full_name}.`, 
        type: 'success' 
      })
      setSelectedStudentForSupervisor(null)
      setSupervisorInput('')
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to assign supervisor.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">User Directory</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Manage system access, assign roles, assign supervisors, and administer all {users.length} registered users.
            </p>
          </div>
        </div>
      </div>

      {/* Admin note about supervisor assignment */}
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-start gap-3">
        <UserPlus className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-cyan-800">
          <span className="font-black">Admin Action:</span> To assign a student to a supervisor, click the{' '}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-100 rounded-md font-black text-cyan-700 text-[10px]">
            <UserPlus className="w-3 h-3" /> Assign Supervisor
          </span>{' '}
          button on any student row below. Only approved supervisors will appear in the selection.
        </p>
      </div>

      {/* Alert message notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search section */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Users listing Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="px-6 py-4">Full Name & Email</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Department / Affiliation</th>
                <th className="px-6 py-4">Identity Details</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold text-xs">
                    No users found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleInfo = ROLE_CONFIG[user.role] || {
                    label: user.role,
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                    icon: Users
                  }
                  const Icon = roleInfo.icon
                  const isSelf = currentUser?.id === user.id
                  const isStudent = user.role === 'student'

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Email */}
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {user.full_name}
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-350" />
                            {user.email}
                          </div>
                        </div>
                      </td>

                      {/* Badge status */}
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-bold ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {roleInfo.label}
                          </span>
                          {user.role === 'student' && user.needs_supervisor && (
                            <span className="block text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg w-fit animate-pulse">
                              ⚠️ Awaiting Supervisor
                            </span>
                          )}
                          {user.role === 'student' && user.supervisor_name && (
                            <span className="block text-[8px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg w-fit">
                              ✓ {user.supervisor_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-700">
                          {user.department || <span className="text-slate-400 italic font-semibold">Not Specified</span>}
                        </span>
                      </td>

                      {/* ID Info */}
                      <td className="px-6 py-5">
                        {user.role === 'student' ? (
                          <div className="text-[10px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block">Student ID</span>
                            <span className="text-slate-700 font-black">{user.student_id || '—'}</span>
                          </div>
                        ) : ['instructor', 'supervisor', 'examiner'].includes(user.role) ? (
                          <div className="text-[10px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block">Staff ID</span>
                            <span className="text-slate-700 font-black">{user.staff_id || '—'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic font-semibold text-[10px]">None required</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign Supervisor — only for students */}
                          {isStudent && (
                            <button
                              onClick={() => {
                                setSelectedStudentForSupervisor(user)
                                setSupervisorInput('')
                              }}
                              className="p-2 border border-cyan-200 text-cyan-600 hover:text-cyan-800 rounded-xl hover:bg-cyan-50 hover:shadow-sm transition-all"
                              title="Assign Supervisor"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUserForRole(user)
                              setRoleInput(user.role)
                            }}
                            disabled={isSelf}
                            className="p-2 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit User Role"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUserForDelete(user)}
                            disabled={isSelf}
                            className="p-2 border border-slate-250 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Assign Supervisor Modal ── */}
      <AnimatePresence>
        {selectedStudentForSupervisor && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full relative space-y-6"
            >
              <button 
                onClick={() => setSelectedStudentForSupervisor(null)} 
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-3">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-950 leading-tight">Assign Supervisor</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Assign an academic supervisor to{' '}
                  <span className="font-black text-slate-800">{selectedStudentForSupervisor.full_name}</span>.
                  This will update all their active projects.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Select Supervisor
                  </label>
                  {supervisors.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold">
                      No approved supervisors are available yet. Ask supervisors to register and then approve their accounts first.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {supervisors.map((sup) => {
                        const isSelected = supervisorInput === sup.id
                        return (
                          <button
                            key={sup.id}
                            type="button"
                            onClick={() => setSupervisorInput(sup.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                              isSelected 
                                ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-offset-1 ring-cyan-500/20' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                              {sup.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{sup.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold truncate">{sup.department || sup.email}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-600 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedStudentForSupervisor(null)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignSupervisor}
                    disabled={actionLoading || !supervisorInput}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-600/10 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Assign
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role edit modal */}
      <AnimatePresence>
        {selectedUserForRole && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full relative space-y-6"
            >
              <button 
                onClick={() => setSelectedUserForRole(null)} 
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950 leading-tight">Change User Role</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Update role for <span className="font-black text-slate-800">{selectedUserForRole.full_name}</span> ({selectedUserForRole.email}).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select New Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                      const isSelected = roleInput === key
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRoleInput(key)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 font-extrabold ring-2 ring-offset-1 ring-indigo-500/20 shadow-sm' 
                              : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">{config.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedUserForRole(null)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRole}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User account confirmation modal */}
      <AnimatePresence>
        {selectedUserForDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full relative space-y-6"
            >
              <button 
                onClick={() => setSelectedUserForDelete(null)} 
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-3 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-950 leading-tight">Delete User Account?</h3>
                  <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto leading-relaxed">
                    This will permanently delete the account of <span className="font-bold text-slate-800">{selectedUserForDelete.full_name}</span>. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedUserForDelete(null)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                >
                  No, Keep User
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/10 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Yes, Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
