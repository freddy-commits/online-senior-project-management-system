/**
 * Formats a date string into a human-readable format: "MMM D, YYYY" (e.g. "Jun 18, 2026").
 * Returns an empty string if the date string is invalid.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
