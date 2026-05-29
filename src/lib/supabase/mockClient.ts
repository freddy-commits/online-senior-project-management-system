import { getDbState, saveDbState, getActiveMockUser, getActiveMockRole, MockProfile } from './mockDb'

class MockQueryBuilder {
  private tableName: string
  private filters: Array<(item: any) => boolean> = []
  private orderCol: string | null = null
  private orderAsc: boolean = true
  private limitCount: number | null = null
  private isSingle: boolean = false
  private action: 'select' | 'insert' | 'update' = 'select'
  private insertData: any = null
  private updateData: any = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields?: string) {
    this.action = 'select'
    return this
  }

  eq(column: string, value: any) {
    this.filters.push(item => item[column] === value)
    return this
  }

  neq(column: string, value: any) {
    this.filters.push(item => item[column] !== value)
    return this
  }

  or(expr: string) {
    this.filters.push(item => {
      const match = expr.match(/[a-zA-Z0-9-]{5,}/g) || []
      if (match.length >= 4) {
        const u1 = match[1]
        const u2 = match[2]
        const u3 = match[4]
        const u4 = match[5]
        // Match standard chat pair logic
        return (item.sender_id === u1 && item.receiver_id === u2) ||
               (item.sender_id === u3 && item.receiver_id === u4)
      }
      return true
    })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column
    this.orderAsc = options?.ascending ?? true
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  insert(data: any) {
    this.action = 'insert'
    this.insertData = data
    return this
  }

  update(data: any) {
    this.action = 'update'
    this.updateData = data
    return this
  }

  // Thenable implementation to support direct `await`
  async then(resolve: (value: any) => void) {
    try {
      const state = getDbState()
      const table = (state as any)[this.tableName] || []

      if (this.action === 'select') {
        let result = table.filter((item: any) => {
          return this.filters.every(f => f(item))
        })

        // Emulate joins
        result = result.map((item: any) => {
          const cloned = { ...item }
          if (this.tableName === 'projects') {
            const student = state.profiles.find(p => p.id === item.student_id)
            const supervisor = state.profiles.find(p => p.id === item.supervisor_id)
            const partner = state.profiles.find(p => p.id === item.partner_id)
            cloned.student = student ? { full_name: student.full_name, email: student.email } : null
            cloned.supervisor = supervisor ? { full_name: supervisor.full_name, email: supervisor.email } : null
            cloned.partner = partner ? { full_name: partner.full_name, email: partner.email } : null
            cloned.profiles = supervisor ? { full_name: supervisor.full_name, email: supervisor.email } : null // backward compatibility mapping
          }
          return cloned
        })

        if (this.orderCol) {
          result.sort((a: any, b: any) => {
            const valA = a[this.orderCol!]
            const valB = b[this.orderCol!]
            if (valA < valB) return this.orderAsc ? -1 : 1
            if (valA > valB) return this.orderAsc ? 1 : -1
            return 0
          })
        }

        if (this.limitCount !== null) {
          result = result.slice(0, this.limitCount)
        }

        if (this.isSingle) {
          resolve({ data: result[0] || null, error: null })
        } else {
          resolve({ data: result, error: null })
        }

      } else if (this.action === 'insert') {
        const rowsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
        const newRows = rowsToInsert.map((row: any) => {
          return {
            id: row.id || `mock-${Math.random().toString(36).substring(2, 11)}`,
            created_at: new Date().toISOString(),
            ...row
          }
        })

        ;(state as any)[this.tableName] = [...table, ...newRows]
        saveDbState(state)

        const returnedData = Array.isArray(this.insertData) ? newRows : newRows[0]
        resolve({ data: returnedData, error: null })

      } else if (this.action === 'update') {
        const updatedTable = table.map((item: any) => {
          const matches = this.filters.every(f => f(item))
          if (matches) {
            return { ...item, ...this.updateData }
          }
          return item
        })

        ;(state as any)[this.tableName] = updatedTable
        saveDbState(state)

        const updatedRows = updatedTable.filter((item: any) => this.filters.every(f => f(item)))
        resolve({ data: this.isSingle ? updatedRows[0] || null : updatedRows, error: null })
      }
    } catch (e: any) {
      resolve({ data: null, error: { message: e.message } })
    }
  }
}

export function createMockClient() {
  return {
    from(tableName: string) {
      return new MockQueryBuilder(tableName)
    },
    
    channel(channelName: string) {
      return {
        on(event: string, filter: any, callback: (payload: any) => void) {
          return this
        },
        subscribe(callback?: (status: string) => void) {
          if (callback) callback('SUBSCRIBED')
          return this
        }
      }
    },

    removeChannel(channel: any) {
      return Promise.resolve()
    },

    auth: {
      async getUser() {
        const user = getActiveMockUser()
        if (!user) return { data: { user: null }, error: null }
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: {
                role: user.role,
                full_name: user.full_name
              }
            }
          },
          error: null
        }
      },

      async signInWithPassword({ email, role = 'student' }: { email: string, role?: string }) {
        const state = getDbState()
        let resolvedRole = role
        if (role === 'industry') resolvedRole = 'partner'
        if (role === 'admin') resolvedRole = 'instructor'

        let user = state.profiles.find(p => p.email === email)
        
        if (!user) {
          // Auto create user in mock database to avoid errors
          user = {
            id: `demo-${resolvedRole}-${Math.random().toString(36).substring(2, 9)}`,
            full_name: email.split('@')[0].toUpperCase(),
            role: resolvedRole as any,
            email: email
          }
          state.profiles.push(user)
          saveDbState(state)
        }

        // Set cookies
        document.cookie = `demo_mode=true; path=/`
        document.cookie = `demo_role=${user.role}; path=/`
        
        return { data: { user: { id: user.id, email: user.email } }, error: null }
      },

      async signUp({ email, password, options }: any) {
        const state = getDbState()
        const fullName = options?.data?.full_name || email.split('@')[0]
        let role = options?.data?.role || 'student'
        if (role === 'industry') role = 'partner'
        if (role === 'admin') role = 'instructor'

        const newUser: MockProfile = {
          id: `demo-${role}-${Math.random().toString(36).substring(2, 9)}`,
          full_name: fullName,
          role: role,
          email: email
        }

        state.profiles.push(newUser)
        saveDbState(state)

        // Set cookies
        document.cookie = `demo_mode=true; path=/`
        document.cookie = `demo_role=${role}; path=/`

        return {
          data: {
            user: {
              id: newUser.id,
              email: newUser.email,
              user_metadata: {
                role: newUser.role,
                full_name: newUser.full_name
              }
            }
          },
          error: null
        }
      },

      async signOut() {
        // Clear sandbox cookies
        document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        document.cookie = 'demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        return { error: null }
      }
    }
  }
}
