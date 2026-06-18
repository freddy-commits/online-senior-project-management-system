import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate helper', () => {
  it('should format a valid date string correctly', () => {
    expect(formatDate('2026-06-18')).toBe('Jun 18, 2026')
    expect(formatDate('2026-12-25T10:00:00Z')).toBe('Dec 25, 2026')
  })

  it('should return an empty string for invalid dates', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })
})
