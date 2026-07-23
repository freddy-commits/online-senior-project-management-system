'use client'

import { useState } from 'react'
import { GraduationCap, Save, ShieldCheck, Loader2 } from 'lucide-react'

export default function AcademicDetailsSection({ initialData, onSave }: { initialData: any, onSave: (data: any) => Promise<boolean> }) {
  const [data, setData] = useState({
    student_id: initialData?.student_id || '',
    course: initialData?.course || '',
    year_of_study: initialData?.year_of_study || '4',
    department: initialData?.department || '',
    institution: initialData?.institution || '',
    graduation_year: initialData?.graduation_year || new Date().getFullYear().toString()
  })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({})

  const validate = () => {
    const newErrors: { [key: string]: boolean } = {}
    if (!data.student_id.trim()) newErrors.student_id = true
    if (!data.course.trim()) newErrors.course = true
    if (!data.department.trim()) newErrors.department = true
    if (!data.institution.trim()) newErrors.institution = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setSaving(true)
    setSuccess(false)
    
    const ok = await onSave(data)
    if (ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
        <GraduationCap className="w-5 h-5 text-blue-600" />
        Academic Details
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Student ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.student_id}
              onChange={(e) => setData({ ...data, student_id: e.target.value })}
              className={`w-full bg-slate-50 border ${errors.student_id ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium`}
              placeholder="e.g. CS/1234/2026"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Institution Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.institution}
              onChange={(e) => setData({ ...data, institution: e.target.value })}
              className={`w-full bg-slate-50 border ${errors.institution ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Course / Major <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.course}
              onChange={(e) => setData({ ...data, course: e.target.value })}
              className={`w-full bg-slate-50 border ${errors.course ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium`}
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Department <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.department}
              onChange={(e) => setData({ ...data, department: e.target.value })}
              className={`w-full bg-slate-50 border ${errors.department ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Year of Study</label>
            <select
              value={data.year_of_study}
              onChange={(e) => setData({ ...data, year_of_study: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium appearance-none"
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4 (Senior)</option>
              <option value="5">Year 5+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Graduation Year</label>
            <select
              value={data.graduation_year}
              onChange={(e) => setData({ ...data, graduation_year: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium appearance-none"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Academic details saved!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Academics
          </button>
        </div>
      </form>
    </div>
  )
}
