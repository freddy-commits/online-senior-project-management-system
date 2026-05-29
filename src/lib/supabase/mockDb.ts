// Seed data and state manager for the Sandbox database stored in localStorage.

export interface MockProfile {
  id: string
  full_name: string
  role: 'student' | 'instructor' | 'supervisor' | 'partner'
  email: string
  phone?: string
}

export interface MockProject {
  id: string
  title: string
  description: string
  student_id: string
  supervisor_id: string | null
  partner_id: string | null // Nullable for internal academic projects
  status: 'pending' | 'approved' | 'rejected'
  origin: 'student' | 'industry'
  final_grade: string | null
  created_at: string
}

export interface MockDeliverable {
  id: string
  project_id: string
  title: string
  description: string
  submission_url?: string
  status: 'todo' | 'submitted' | 'awaiting_partner' | 'partner_approved' | 'completed'
  feedback_supervisor?: string
  feedback_partner?: string
  due_date?: string
  created_at: string
}

export interface MockMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export interface MockNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'system' | 'deadline'
  is_read: boolean
  action_url?: string
  action_label?: string
  created_at: string
}

export interface MockAnnouncement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  target_role: 'all' | 'student' | 'instructor' | 'supervisor' | 'partner'
  created_at: string
}

export interface MockDbState {
  profiles: MockProfile[]
  projects: MockProject[]
  deliverables: MockDeliverable[]
  messages: MockMessage[]
  notifications: MockNotification[]
  announcements: MockAnnouncement[]
}

const DEFAULT_PROFILES: MockProfile[] = [
  { id: 'demo-student-id', full_name: 'Alex Carter', role: 'student', email: 'student@university.edu', phone: '+254712345678' },
  { id: 'demo-instructor-id', full_name: 'Dr. Sarah Johnson', role: 'instructor', email: 'instructor@university.edu', phone: '+254723456789' },
  { id: 'demo-supervisor-id', full_name: 'Dr. Robert Miller', role: 'supervisor', email: 'supervisor@university.edu', phone: '+254756123456' },
  { id: 'demo-partner-id', full_name: 'TechCorp Mentorship', role: 'partner', email: 'partner@techcorp.com', phone: '+254734567890' },
  // Additional users to act as alternative student contacts
  { id: 'demo-student-2', full_name: 'Chloe Smith', role: 'student', email: 'chloe@university.edu', phone: '+254756789012' },
  { id: 'demo-student-3', full_name: 'Marcus Miller', role: 'student', email: 'marcus@university.edu', phone: '+254767890123' }
]

const DEFAULT_PROJECTS: MockProject[] = [
  {
    id: 'demo-project-id',
    title: 'AI-Powered Healthcare Dashboard',
    description: 'An interactive web application leveraging machine learning models to predict patient readmission rates and optimize staffing configurations.',
    student_id: 'demo-student-id',
    supervisor_id: 'demo-supervisor-id',
    partner_id: 'demo-partner-id',
    status: 'approved',
    origin: 'industry',
    final_grade: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'demo-solo-project',
    title: 'Student Portfolio Web Application',
    description: 'A personal portfolio website built with Next.js and deployed on Vercel, showcasing academic projects and technical skills.',
    student_id: 'demo-student-2',
    supervisor_id: 'demo-supervisor-id',
    partner_id: null, // Internal academic project
    status: 'pending',
    origin: 'student',
    final_grade: null,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
]

const DEFAULT_DELIVERABLES: MockDeliverable[] = [
  {
    id: 'deliv-1',
    project_id: 'demo-project-id',
    title: 'Project Proposal',
    description: 'Initial project scope, requirements, and tech stack options.',
    submission_url: 'https://docs.google.com/document/d/demo-proposal',
    status: 'submitted',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'deliv-2',
    project_id: 'demo-project-id',
    title: 'System Architecture & Design',
    description: 'Detailed data model diagrams, API specifications, and infrastructure layouts.',
    status: 'todo',
    due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'deliv-3',
    project_id: 'demo-project-id',
    title: 'Final Report & Code Submission',
    description: 'Production-ready codebase repository URL, developer guidelines, and final slide decks.',
    status: 'todo',
    due_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  // Solo project deliverables
  {
    id: 'deliv-solo-1',
    project_id: 'demo-solo-project',
    title: 'Project Proposal',
    description: 'Initial project scope, requirements, and tech stack options.',
    status: 'todo',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
]

const DEFAULT_MESSAGES: MockMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'demo-supervisor-id',
    receiver_id: 'demo-student-id',
    content: 'Welcome to the Senior Project portal! I will review your proposal by the end of the week. Please prepare your system architecture in the meantime.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  }
]

const DEFAULT_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-1',
    user_id: 'demo-student-id',
    title: 'Proposal Submitted',
    message: 'Your project proposal has been sent to the department for review.',
    type: 'system',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
]

const DEFAULT_ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Senior Project Guidelines 2026',
    content: 'The official project guidelines document is now available. All students and supervisors are required to review the grading rubrics and timeline milestones before submitting the first deliverable.',
    is_pinned: true,
    target_role: 'all',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ann-2',
    title: 'Upcoming Midterm Vetting Presentations',
    content: 'Please schedule your midterm vetting presentations by Friday. Your panels are assigned in the Vetting section.',
    is_pinned: false,
    target_role: 'instructor',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const INITIAL_STATE: MockDbState = {
  profiles: DEFAULT_PROFILES,
  projects: DEFAULT_PROJECTS,
  deliverables: DEFAULT_DELIVERABLES,
  messages: DEFAULT_MESSAGES,
  notifications: DEFAULT_NOTIFICATIONS,
  announcements: DEFAULT_ANNOUNCEMENTS
}

// Global server-side state for Next.js Server Components
if (typeof global !== 'undefined') {
  if (!(global as any).sandboxDb) {
    (global as any).sandboxDb = JSON.parse(JSON.stringify(INITIAL_STATE))
  }
}

// Helpers for localStorage environment detection
const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'seniorproj_sandbox_db_v2'

export function getDbState(): MockDbState {
  if (!isClient) {
    return (global as any).sandboxDb || INITIAL_STATE
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE))
      // Sync to server
      fetch('/api/sandbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INITIAL_STATE)
      }).catch(() => {})
      return INITIAL_STATE
    }
    
    // Auto-migrate: merge missing tables into existing state
    const parsed = JSON.parse(data)
    let migrated = false
    Object.keys(INITIAL_STATE).forEach(key => {
      if (!(key in parsed)) {
        parsed[key] = (INITIAL_STATE as any)[key]
        migrated = true
      }
    })
    
    // Auto-migrate individual project records for new schema fields
    if (parsed.projects) {
      parsed.projects = parsed.projects.map((p: any) => {
        let singleProjMigrated = false
        const updated = { ...p }
        if (!updated.origin) {
          updated.origin = updated.partner_id || updated.industry_partner_id ? 'industry' : 'student'
          singleProjMigrated = true
        }
        if (updated.instructor_id !== undefined) {
          updated.supervisor_id = updated.instructor_id || updated.supervisor_id || null
          delete updated.instructor_id
          singleProjMigrated = true
        }
        if (updated.industry_partner_id !== undefined) {
          updated.partner_id = updated.industry_partner_id || updated.partner_id || null
          delete updated.industry_partner_id
          singleProjMigrated = true
        }
        if (updated.team_members !== undefined) {
          delete updated.team_members
          singleProjMigrated = true
        }
        if (singleProjMigrated) {
          migrated = true
        }
        return updated
      })
    }
    
    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      fetch('/api/sandbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      }).catch(() => {})
    }
    return parsed
  } catch (e) {
    console.error('Error reading sandbox state from localStorage:', e)
    return INITIAL_STATE
  }
}

export function saveDbState(state: MockDbState) {
  if (!isClient) {
    if (typeof global !== 'undefined') {
      (global as any).sandboxDb = state
    }
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    // Sync to server
    fetch('/api/sandbox/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(() => {})
  } catch (e) {
    console.error('Error saving sandbox state to localStorage:', e)
  }
}

export function resetDbState() {
  if (typeof global !== 'undefined') {
    (global as any).sandboxDb = JSON.parse(JSON.stringify(INITIAL_STATE))
  }
  if (!isClient) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE))
    fetch('/api/sandbox/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(INITIAL_STATE)
    }).catch(() => {})
  } catch (e) {
    console.error('Error resetting sandbox state:', e)
  }
}

// Global active user in cookie helper
export function getActiveMockRole(): 'student' | 'instructor' | 'supervisor' | 'partner' {
  if (!isClient) return 'student'
  const match = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)
  const role = match ? match[2] : 'student'
  if (role === 'industry') return 'partner' // backward compatibility mapping
  return role as any
}

export function getActiveMockUser(): MockProfile {
  const role = getActiveMockRole()
  const profiles = getDbState().profiles
  return profiles.find(p => p.role === role) || profiles[0]
}
