'use client'

import { useEffect, useState } from 'react'

interface DiagResult {
  env_url?: string
  env_key_set?: boolean
  internet?: string
  supabase_reach?: string
  supabase_status?: number
  supabase_ms?: number
  supabase_error?: string
  supabase_cause?: string
  auth_endpoint?: string
  auth_status?: number
  auth_error?: string
}

export default function DebugPage() {
  const [serverResult, setServerResult] = useState<DiagResult | null>(null)
  const [browserResult, setBrowserResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Server-side test
    fetch('/api/debug')
      .then(r => r.json())
      .then(data => setServerResult(data))
      .catch(err => setServerResult({ supabase_error: err.message }))
      .finally(() => setLoading(false))

    // Browser-side test
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const results: Record<string, unknown> = {
      env_url_browser: url || 'MISSING',
      env_key_set: !!key,
    }

    fetch(`${url}/auth/v1/settings`, {
      headers: { 'apikey': key || '' },
    })
      .then(r => {
        results.browser_supabase = 'SUCCESS'
        results.browser_status = r.status
        setBrowserResult({ ...results })
      })
      .catch(err => {
        results.browser_supabase = 'FAILED'
        results.browser_error = err.message
        setBrowserResult({ ...results })
      })
  }, [])

  const StatusBadge = ({ value }: { value: unknown }) => {
    const str = String(value)
    const isGood = str.includes('OK') || str.includes('SUCCESS') || str.includes('REACHABLE') || str === 'true'
    const isBad = str.includes('FAIL') || str.includes('MISSING') || str === 'false'
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${isGood ? 'bg-green-100 text-green-700' : isBad ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
        {str}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-2 text-cyan-400">🔬 Supabase Connection Diagnostics</h1>
      <p className="text-slate-400 mb-8 text-sm">This page tests the connection from both the Server (Node.js) and the Browser.</p>

      {loading && <p className="text-yellow-400 animate-pulse">Running tests...</p>}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Server Results */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">🖥️ Server-Side (Node.js)</h2>
          {serverResult ? (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(serverResult).map(([key, val]) => (
                  <tr key={key} className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">{key}</td>
                    <td className="py-2"><StatusBadge value={val} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !loading ? <p className="text-red-400">Could not reach /api/debug</p> : null}
        </div>

        {/* Browser Results */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-lg font-bold text-blue-400 mb-4">🌐 Browser-Side</h2>
          {browserResult ? (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(browserResult).map(([key, val]) => (
                  <tr key={key} className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-400">{key}</td>
                    <td className="py-2"><StatusBadge value={val} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !loading ? <p className="text-red-400">Browser test failed to run.</p> : null}
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <h3 className="text-slate-400 text-sm font-bold mb-2">📋 How to read the results:</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>🟢 <span className="text-green-400">SUCCESS / OK</span> → That test passed</li>
          <li>🔴 <span className="text-red-400">FAILED</span> → That specific layer is broken</li>
          <li><span className="text-yellow-400">supabase_cause: ENOTFOUND</span> → DNS issue (domain not found)</li>
          <li><span className="text-yellow-400">supabase_cause: UND_ERR_CONNECT_TIMEOUT</span> → Firewall blocking port 443</li>
        </ul>
      </div>
    </div>
  )
}
