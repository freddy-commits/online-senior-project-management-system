// Seed data and state manager for the Sandbox database stored in localStorage.

export interface MockProfile {
  id: string
  full_name: string
  role: 'student' | 'instructor' | 'industry' | 'admin'
  email: string
}

export interface MockProject {
  id: string
  title: string
  description: string
  student_id: string
  instructor_id: string | null
  industry_partner_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_recommended: boolean
  created_at: string
}

export interface MockDeliverable {
  id: string
  project_id: string
  title: string
  description: string
  submission_url?: string
  status: 'todo' | 'submitted' | 'graded'
  grade?: string
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
  created_at: string
}

export interface MockDbState {
  profiles: MockProfile[]
  projects: MockProject[]
  deliverables: MockDeliverable[]
  messages: MockMessage[]
  notifications: MockNotification[]
}

const DEFAULT_PROFILES: MockProfile[] = [
  { id: 'demo-student-id', full_name: 'Alex Carter', role: 'student', email: 'student@university.edu' },
  { id: 'demo-instructor-id', full_name: 'Dr. Sarah Johnson', role: 'instructor', email: 'instructor@university.edu' },
  { id: 'demo-industry-id', full_name: 'TechCorp Mentorship', role: 'industry', email: 'partner@techcorp.com' },
  { id: 'demo-admin-id', full_name: 'Admin Admin', role: 'admin', email: 'admin@university.edu' },
  // Additional users to act as alternative contacts or student leads
  { id: 'demo-student-2', full_name: 'Chloe Smith', role: 'student', email: 'chloe@university.edu' },
  { id: 'demo-student-3', full_name: 'Marcus Miller', role: 'student', email: 'marcus@university.edu' }
]

const DEFAULT_PROJECTS: MockProject[] = [
  {
    id: 'demo-project-id',
    title: 'AI-Powered Healthcare Dashboard',
    description: 'An interactive web application leveraging machine learning models to predict patient readmission rates and optimize staffing configurations.',
    student_id: 'demo-student-id',
    instructor_id: 'demo-instructor-id',
    industry_partner_id: 'demo-industry-id',
    status: 'pending',
    is_recommended: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
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
  }
]

const DEFAULT_MESSAGES: MockMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'demo-instructor-id',
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

const INITIAL_STATE: MockDbState = {
  profiles: DEFAULT_PROFILES,
  projects: DEFAULT_PROJECTS,
  deliverables: DEFAULT_DELIVERABLES,
  messages: DEFAULT_MESSAGES,
  notifications: DEFAULT_NOTIFICATIONS
}

// Global server-side state for Next.js Server Components
if (typeof global !== 'undefined') {
  if (!(global as any).sandboxDb) {
    (global as any).sandboxDb = JSON.parse(JSON.stringify(INITIAL_STATE))
  }
}

// Helpers for localStorage environment detection
const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'seniorproj_sandbox_db'

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
    return JSON.parse(data)
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
export function getActiveMockRole(): 'student' | 'instructor' | 'industry' | 'admin' {
  if (!isClient) return 'student'
  const match = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)
  return (match ? match[2] : 'student') as any
}

export function getActiveMockUser(): MockProfile {
  const role = getActiveMockRole()
  const profiles = getDbState().profiles
  return profiles.find(p => p.role === role) || profiles[0]
}
