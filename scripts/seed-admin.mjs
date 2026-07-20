// Recreated seed-admin script
// Usage: node scripts/seed-admin.mjs <email>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envPath = new URL('../.env.local', import.meta.url).pathname.slice(1)
let SUPABASE_URL = ''
let SERVICE_ROLE_KEY = ''

try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=')
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '')
    if (key?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = value
    if (key?.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_ROLE_KEY = value
  }
} catch {
  console.error('Could not read .env.local. Falling back to process.env.')
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

const email = process.argv[2]

if (!email) {
  console.error('\n❌  Usage: node scripts/seed-admin.mjs <email>\n')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log(`\n🔍  Looking up user: ${email}`)

// Find the user via admin API
const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()

if (listError) {
  console.error('❌  Failed to list users:', listError.message)
  process.exit(1)
}

const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

if (!user) {
  console.error(`\n❌  No user found with email: ${email}`)
  console.error('    Make sure the account is registered first via the registration page.\n')
  process.exit(1)
}

console.log(`✅  Found user: ${user.id}`)
console.log(`🔧  Promoting ${email} to admin role...`)

// Update the profiles table — use service_role so the role-protection trigger allows it
const { error: profileError } = await adminSupabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', user.id)

if (profileError) {
  console.error('❌  Failed to update profile role:', profileError.message)
  process.exit(1)
}

// Also update user_metadata for display (not used for auth decisions)
const { error: metaError } = await adminSupabase.auth.admin.updateUserById(user.id, {
  user_metadata: { role: 'admin' }
})

if (metaError) {
  console.warn('⚠️   Could not update user_metadata (non-critical):', metaError.message)
}

console.log(`\n🎉  SUCCESS! ${email} is now an ADMIN.`)
console.log('    They can now log in and visit /admin/dashboard to approve role requests.\n')
