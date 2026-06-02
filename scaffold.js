const fs = require('fs')
const path = require('path')

const baseDir = path.join(__dirname, 'src', 'app')
const roles = ['student', 'advisor', 'supervisor', 'coordinator', 'panel', 'partner']

const modules = {
  'dashboard': [['Overview', 'overview'], ['Action Items', 'action-items'], ['Notifications', 'notifications']],
  'milestones': [['All Milestones', 'all'], ['Pending Review', 'pending-review'], ['Completed', 'completed']],
  'teams': [['Workspace Overview', 'workspace'], ['Team Chat', 'chat'], ['Activity Logs', 'activity']],
  'documents': [['File Repository', 'repository'], ['Upload History', 'history'], ['Approvals & Sign-offs', 'approvals']]
}

const layoutTemplate = `import ContextualTabs from '@/components/navigation/ContextualTabs'

export default function {Module}Layout({ children }: { children: React.ReactNode }) {
  const tabs = [
{Tabs}
  ]
  return (
    <div className="flex flex-col h-full relative">
      <ContextualTabs tabs={tabs} />
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  )
}
`

const pageRedirectTemplate = `import { redirect } from 'next/navigation'
export default function RedirectPage() {
  redirect('/{role}/{module}/{default_sub}')
}
`

const pageContentTemplate = `export default function {Title}Page() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 min-h-[50vh]">
      <h2 className="text-xl font-black text-slate-900 mb-2">{Title}</h2>
      <p className="text-sm text-slate-500 font-semibold">This is the {Title} view for {Role}.</p>
    </div>
  )
}
`

const masterLayoutTemplate = `import MasterSidebar from '@/components/layout/MasterSidebar'
import MasterHeader from '@/components/layout/MasterHeader'
import { TrackProvider } from '@/components/providers/TrackProvider'

export default function {Role}MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex overflow-hidden font-sans">
         <MasterSidebar role="{role}" />
         <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
           <MasterHeader role="{role}" />
           {children}
         </main>
      </div>
    </TrackProvider>
  )
}
`

roles.forEach(role => {
  const roleDir = path.join(baseDir, role)
  fs.mkdirSync(roleDir, { recursive: true })
  
  // Master layout
  fs.writeFileSync(
    path.join(roleDir, 'layout.tsx'), 
    masterLayoutTemplate.replace(/\{Role\}/g, role.charAt(0).toUpperCase() + role.slice(1)).replace(/\{role\}/g, role)
  )
  
  Object.entries(modules).forEach(([mod, subtabs]) => {
    const modDir = path.join(roleDir, mod)
    fs.mkdirSync(modDir, { recursive: true })
    
    // Build tabs array string
    const tabsStr = subtabs.map(([label, slug]) => `    { label: '${label}', href: '/${role}/${mod}/${slug}' }`)
    const tabsJoined = tabsStr.join(',\n')
    
    // Module layout
    fs.writeFileSync(
      path.join(modDir, 'layout.tsx'),
      layoutTemplate.replace(/\{Module\}/g, mod.charAt(0).toUpperCase() + mod.slice(1)).replace(/\{Tabs\}/g, tabsJoined)
    )
    
    // Module page (redirect)
    fs.writeFileSync(
      path.join(modDir, 'page.tsx'),
      pageRedirectTemplate.replace(/\{role\}/g, role).replace(/\{module\}/g, mod).replace(/\{default_sub\}/g, subtabs[0][1])
    )
    
    // Sub pages
    subtabs.forEach(([label, slug]) => {
      const subDir = path.join(modDir, slug)
      fs.mkdirSync(subDir, { recursive: true })
      fs.writeFileSync(
        path.join(subDir, 'page.tsx'),
        pageContentTemplate.replace(/\{Title\}/g, label).replace(/\{Role\}/g, role.charAt(0).toUpperCase() + role.slice(1))
      )
    })
  })

  // Settings
  const settingsDir = path.join(roleDir, 'settings')
  fs.mkdirSync(settingsDir, { recursive: true })
  fs.writeFileSync(
    path.join(settingsDir, 'page.tsx'),
    pageContentTemplate.replace(/\{Title\}/g, 'Settings').replace(/\{Role\}/g, role.charAt(0).toUpperCase() + role.slice(1))
  )
})

console.log('Scaffolded role directories successfully via Node.js')
