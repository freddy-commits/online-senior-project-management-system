import os

base_dir = r'c:\Users\Gynocare\Desktop\online-senior-project-management-system\online-senior-project-management-system\src\app'
roles = ['student', 'advisor', 'supervisor', 'coordinator', 'panel', 'partner']

modules = {
    'dashboard': [('Overview', 'overview'), ('Action Items', 'action-items'), ('Notifications', 'notifications')],
    'milestones': [('All Milestones', 'all'), ('Pending Review', 'pending-review'), ('Completed', 'completed')],
    'teams': [('Workspace Overview', 'workspace'), ('Team Chat', 'chat'), ('Activity Logs', 'activity')],
    'documents': [('File Repository', 'repository'), ('Upload History', 'history'), ('Approvals & Sign-offs', 'approvals')]
}

layout_template = """import ContextualTabs from '@/components/navigation/ContextualTabs'

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
"""

page_redirect_template = """import { redirect } from 'next/navigation'
export default function RedirectPage() {
  redirect('/{role}/{module}/{default_sub}')
}
"""

page_content_template = """export default function {Title}Page() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 min-h-[50vh]">
      <h2 className="text-xl font-black text-slate-900 mb-2">{Title}</h2>
      <p className="text-sm text-slate-500 font-semibold">This is the {Title} view for {Role}.</p>
    </div>
  )
}
"""

master_layout_template = """import MasterSidebar from '@/components/layout/MasterSidebar'
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
"""

for role in roles:
    role_dir = os.path.join(base_dir, role)
    os.makedirs(role_dir, exist_ok=True)
    
    # Master layout
    with open(os.path.join(role_dir, 'layout.tsx'), 'w', encoding='utf-8') as f:
        f.write(master_layout_template.replace('{Role}', role.capitalize()).replace('{role}', role))
        
    for mod, subtabs in modules.items():
        mod_dir = os.path.join(role_dir, mod)
        os.makedirs(mod_dir, exist_ok=True)
        
        # Build tabs array string
        tabs_str = []
        for label, slug in subtabs:
            tabs_str.append(f"    {{ label: '{label}', href: '/{role}/{mod}/{slug}' }}")
        tabs_joined = ',\n'.join(tabs_str)
        
        # Module layout
        with open(os.path.join(mod_dir, 'layout.tsx'), 'w', encoding='utf-8') as f:
            f.write(layout_template.replace('{Module}', mod.capitalize()).replace('{Tabs}', tabs_joined))
            
        # Module page (redirect)
        with open(os.path.join(mod_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
            f.write(page_redirect_template.replace('{role}', role).replace('{module}', mod).replace('{default_sub}', subtabs[0][1]))
            
        # Sub pages
        for label, slug in subtabs:
            sub_dir = os.path.join(mod_dir, slug)
            os.makedirs(sub_dir, exist_ok=True)
            with open(os.path.join(sub_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
                f.write(page_content_template.replace('{Title}', label).replace('{Role}', role.capitalize()))

    # Settings
    settings_dir = os.path.join(role_dir, 'settings')
    os.makedirs(settings_dir, exist_ok=True)
    with open(os.path.join(settings_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
        f.write(page_content_template.replace('{Title}', 'Settings').replace('{Role}', role.capitalize()))

print('Scaffolded role directories successfully')
