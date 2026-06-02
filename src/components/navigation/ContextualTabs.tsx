'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface TabItem {
  label: string
  href: string
}

interface ContextualTabsProps {
  tabs: TabItem[]
}

export default function ContextualTabs({ tabs }: ContextualTabsProps) {
  const pathname = usePathname()

  return (
    <div className="w-full border-b border-slate-200 px-8 pt-4 bg-white sticky top-0 z-30">
      <nav className="flex items-center gap-8">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative py-3 text-sm font-bold transition-colors ${
                isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-700 rounded-t-full transition-transform duration-300 ease-out" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
