/**
 * Maps raw Supabase / internal error strings to friendly, human-readable
 * messages that are safe to display directly in the UI.
 *
 * Rules:
 *  - Never expose stack traces, HTTP codes, or internal identifiers.
 *  - Always return a non-empty string.
 *  - Keep messages short, clear, and actionable.
 */
export function getFriendlyAuthError(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.'

  const msg = raw.toLowerCase()

  // ── Credentials ────────────────────────────────────────────────────────────
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.'
  }

  // ── Email confirmation ──────────────────────────────────────────────────────
  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Please verify your email address before signing in.'
  }

  // ── Duplicate account ───────────────────────────────────────────────────────
  if (
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    msg.includes('user already exists') ||
    msg.includes('duplicate') ||
    msg.includes('409')
  ) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  // ── Password policy ─────────────────────────────────────────────────────────
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return 'Your password must be at least 8 characters long.'
  }
  if (msg.includes('password') && msg.includes('weak')) {
    return 'Your password is too weak. Please choose a stronger password.'
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  // ── Network / connection ────────────────────────────────────────────────────
  if (
    msg.includes('network') ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('connection') ||
    msg.includes('econnrefused')
  ) {
    return 'Connection problem. Please check your internet and try again.'
  }

  // ── OAuth / social login ────────────────────────────────────────────────────
  if (
    msg.includes('oauth') ||
    msg.includes('provider') ||
    msg.includes('google') ||
    msg.includes('github') ||
    msg.includes('social')
  ) {
    return 'Social sign-in failed. Please try again or use email & password.'
  }

  // ── Session expired ─────────────────────────────────────────────────────────
  if (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))) {
    return 'Your session has expired. Please sign in again.'
  }

  // ── Server / configuration ──────────────────────────────────────────────────
  if (
    msg.includes('server configuration') ||
    msg.includes('missing environment') ||
    msg.includes('service role') ||
    msg.includes('500')
  ) {
    return 'A server error occurred. Please contact the administrator.'
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  if (msg.includes('missing required fields') || msg.includes('required field')) {
    return 'Please fill in all required fields.'
  }

  if (msg.includes('invalid role') || msg.includes('invalid role specified')) {
    return 'The selected role is not valid. Please refresh and try again.'
  }

  if (msg.includes('invalid email') || msg.includes('email format')) {
    return 'Please enter a valid email address.'
  }

  // ── Institutional email restriction ─────────────────────────────────────────
  if (msg.includes('ueab') || msg.includes('school email') || msg.includes('institutional')) {
    return 'Students must register with a valid school email address (@ueab.ac.ke).'
  }

  // ── Student/Staff ID ────────────────────────────────────────────────────────
  if (msg.includes('student id') || msg.includes('staff id') || msg.includes('university id')) {
    return raw // These are already user-friendly from the validation layer
  }

  // ── Registration failed ──────────────────────────────────────────────────────
  if (msg.includes('registration failed') || msg.includes('failed to create account')) {
    return 'Registration failed. Please check your details and try again.'
  }

  // ── Auth failed (generic) ───────────────────────────────────────────────────
  if (msg.includes('authentication failed') || msg.includes('auth failed')) {
    return 'Authentication failed. Please check your credentials.'
  }

  // ── Fallback ────────────────────────────────────────────────────────────────
  return 'Something went wrong. Please try again.'
}

/**
 * Returns a friendly message for errors shown in the URL query string
 * (e.g. /login?error=...). Decodes and maps to friendly text.
 */
export function getFriendlyUrlError(encodedError: string | null): string {
  if (!encodedError) return ''
  try {
    const decoded = decodeURIComponent(encodedError)
    return getFriendlyAuthError(decoded)
  } catch {
    return 'Something went wrong. Please try again.'
  }
}
