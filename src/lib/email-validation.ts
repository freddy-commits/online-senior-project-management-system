/**
 * School email domain and institutional ID validation utilities.
 * Enforces UEAB email requirements and Student/Staff ID validation.
 */

/** The allowed institutional email domain */
export const SCHOOL_EMAIL_DOMAIN = 'ueab.ac.ke'

/** Roles that require a school email (@ueab.ac.ke) - Empty to allow all email providers */
export const SCHOOL_EMAIL_REQUIRED_ROLES: string[] = []

/** Roles that require a Student ID */
export const STUDENT_ID_ROLES = ['student']

/** Roles that require a Staff ID */
export const STAFF_ID_ROLES = ['instructor', 'supervisor', 'examiner_panel']

/**
 * Check if an email belongs to the school domain.
 */
export function isSchoolEmail(email: string): boolean {
  if (!email) return false
  const domain = email.trim().toLowerCase().split('@')[1]
  return domain === SCHOOL_EMAIL_DOMAIN
}

/**
 * Validate that the email domain is allowed for the given role.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateEmailForRole(email: string, role: string): string | null {
  if (!email) return 'Email is required.'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.'
  }

  return null
}

/**
 * Validate that a Student ID or Staff ID is provided and non-empty for the given role.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateInstitutionalId(id: string | null | undefined, role: string): string | null {
  if (STUDENT_ID_ROLES.includes(role)) {
    if (!id || id.trim().length === 0) {
      return 'Student ID is required for student registration.'
    }
  }

  if (STAFF_ID_ROLES.includes(role)) {
    if (!id || id.trim().length === 0) {
      return 'Staff ID is required for staff registration.'
    }
  }

  return null
}

/**
 * Get the label for the institutional ID field based on the role.
 */
export function getIdFieldLabel(role: string): string | null {
  if (STUDENT_ID_ROLES.includes(role)) return 'Student ID'
  if (STAFF_ID_ROLES.includes(role)) return 'Staff ID'
  return null
}
